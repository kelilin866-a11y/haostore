import { InventoryStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type ConfirmPaymentAndDeliverInput = {
  orderNo: string;
  transactionId?: string | null;
  note: string;
};

export async function confirmPaymentAndDeliverOrder({
  orderNo,
  transactionId,
  note,
}: ConfirmPaymentAndDeliverInput) {
  return prisma.$transaction(async (tx) => {
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

    if (order.paymentStatus !== "paid") {
      return {
        ok: false,
        message: "订单尚未支付，不能确认发货",
        status: 400,
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
    const existingPaymentRecord =
      transactionId && order.paymentRecords.length > 0
        ? order.paymentRecords.find(
            (record) => record.transactionId === transactionId,
          ) || order.paymentRecords[0]
        : order.paymentRecords[0];

    const paymentData = {
      method: order.paymentMethod,
      amount: order.totalAmount,
      status: PaymentStatus.paid,
      transactionId: transactionId || undefined,
      note,
    };

    if (existingPaymentRecord) {
      await tx.paymentRecord.update({
        where: { id: existingPaymentRecord.id },
        data: paymentData,
      });
    } else {
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          ...paymentData,
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
      message: "确认发货成功",
      orderNo: order.orderNo,
      deliveryItems: allocations.map((item) => item.content),
    };
  });
}

export function isInventoryChangedError(error: unknown) {
  return error instanceof Error && error.message === "INVENTORY_CHANGED";
}
