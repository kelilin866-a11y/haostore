import { NextResponse } from "next/server";
import { InventoryStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type ConfirmBody = {
  token?: unknown;
  orderNo?: unknown;
};

const adminToken = process.env.ADMIN_TOKEN || "change-me";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  let body: ConfirmBody;

  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  const token = typeof body.token === "string" ? body.token : "";
  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";

  if (token !== adminToken) {
    return jsonError("无权限", 401);
  }
  if (!orderNo) {
    return jsonError("订单号不能为空");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        deliveryItems: {
          orderBy: { createdAt: "asc" },
        },
        paymentRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return { ok: false, message: "订单不存在", status: 404 };
    }

    if (order.deliveryStatus === "delivered") {
      return {
        ok: true,
        message: "订单已发货，无需重复处理",
        orderNo: order.orderNo,
        deliveryItems: order.deliveryItems.map((item) => item.content),
      };
    }

    if (order.items.length === 0) {
      return { ok: false, message: "订单没有商品明细", status: 400 };
    }

    const allocations: {
      orderItemId: string;
      inventoryItemId: string;
      content: string;
    }[] = [];
    const usedInventoryIds = new Set<string>();

    for (const item of order.items) {
      const inventoryItems = await tx.inventoryItem.findMany({
        where: {
          productId: item.productId,
          variantId: item.variantId,
          status: InventoryStatus.available,
          id: {
            notIn: Array.from(usedInventoryIds),
          },
        },
        orderBy: { createdAt: "asc" },
        take: item.quantity,
      });

      if (inventoryItems.length < item.quantity) {
        return {
          ok: false,
          message: `库存不足：${item.productTitleSnapshot} / ${item.variantNameSnapshot}`,
          status: 400,
        };
      }

      for (const inventoryItem of inventoryItems) {
        usedInventoryIds.add(inventoryItem.id);
        allocations.push({
          orderItemId: item.id,
          inventoryItemId: inventoryItem.id,
          content: inventoryItem.content,
        });
      }
    }

    const now = new Date();
    const existingPaymentRecord = order.paymentRecords[0];

    if (existingPaymentRecord) {
      await tx.paymentRecord.update({
        where: { id: existingPaymentRecord.id },
        data: {
          method: order.paymentMethod,
          amount: order.totalAmount,
          status: PaymentStatus.paid,
          note: "后台人工确认付款",
        },
      });
    } else {
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          method: order.paymentMethod,
          amount: order.totalAmount,
          status: PaymentStatus.paid,
          note: "后台人工确认付款",
        },
      });
    }

    const soldResult = await tx.inventoryItem.updateMany({
      where: {
        id: {
          in: allocations.map((allocation) => allocation.inventoryItemId),
        },
        status: InventoryStatus.available,
      },
      data: {
        status: InventoryStatus.sold,
        orderId: order.id,
        soldAt: now,
      },
    });

    if (soldResult.count !== allocations.length) {
      throw new Error("INVENTORY_CHANGED");
    }

    for (const allocation of allocations) {
      await tx.deliveryItem.create({
        data: {
          orderId: order.id,
          orderItemId: allocation.orderItemId,
          inventoryItemId: allocation.inventoryItemId,
          content: allocation.content,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        deliveryStatus: "delivered",
        orderStatus: "completed",
        paidAt: now,
        deliveredAt: now,
      },
    });

    return {
      ok: true,
      message: "确认付款并发货成功",
      orderNo: order.orderNo,
      deliveryItems: allocations.map((item) => item.content),
    };
  });

    if (!result.ok) {
      return jsonError(result.message, result.status);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVENTORY_CHANGED") {
      return jsonError("库存状态已变化，请刷新后重试");
    }

    return jsonError("确认付款并发货失败，请稍后重试", 500);
  }
}
