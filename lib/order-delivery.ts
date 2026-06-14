import { InventoryStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type ConfirmPaymentAndDeliverInput = {
  orderNo: string;
  transactionId?: string | null;
  note: string;
};

type ConfirmDeliveryResult =
  | {
      ok: true;
      message: string;
      orderNo: string;
      deliveryItems: string[];
    }
  | {
      ok: false;
      message: string;
      status: number;
      details?: unknown;
    };

type Allocation = {
  orderItemId: string;
  inventoryItemId: string;
  content: string;
};

export async function confirmPaymentAndDeliverOrder({
  orderNo,
  transactionId,
  note,
}: ConfirmPaymentAndDeliverInput): Promise<ConfirmDeliveryResult> {
  const order = await prisma.order.findUnique({
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
      message: `订单尚未支付，不能确认发货。当前支付状态：${order.paymentStatus}`,
      status: 400,
      details: {
        orderNo: order.orderNo,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,
      },
    };
  }

  if (order.deliveryStatus !== "pending") {
    return {
      ok: false,
      message: `订单不是待发货状态，不能确认发货。当前发货状态：${order.deliveryStatus}`,
      status: 400,
      details: {
        orderNo: order.orderNo,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,
      },
    };
  }

  if (order.items.length === 0) {
    return { ok: false, message: "订单没有商品明细", status: 400 };
  }

  const allocations: Allocation[] = [];
  const usedInventoryIds = new Set<string>();

  for (const item of order.items) {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        productId: item.productId,
        variantId: item.variantId,
        status: InventoryStatus.available,
        id: {
          notIn: Array.from(usedInventoryIds),
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: item.quantity,
      select: {
        id: true,
        content: true,
      },
    });

    console.log("[order-delivery] Inventory allocation prepared", {
      orderNo: order.orderNo,
      productId: item.productId,
      variantId: item.variantId,
      productTitle: item.productTitleSnapshot,
      variantName: item.variantNameSnapshot,
      requiredQuantity: item.quantity,
      allocatedCount: inventoryItems.length,
    });

    if (inventoryItems.length === 0) {
      return {
        ok: false,
        message: `没有可用库存，无法发货：${item.productTitleSnapshot} / ${item.variantNameSnapshot}`,
        status: 400,
        details: {
          orderNo: order.orderNo,
          productId: item.productId,
          variantId: item.variantId,
          requiredQuantity: item.quantity,
          availableCount: 0,
        },
      };
    }

    if (inventoryItems.length < item.quantity) {
      return {
        ok: false,
        message: `库存不足，无法发货：${item.productTitleSnapshot} / ${item.variantNameSnapshot}，需要 ${item.quantity} 条，当前可用 ${inventoryItems.length} 条`,
        status: 400,
        details: {
          orderNo: order.orderNo,
          productId: item.productId,
          variantId: item.variantId,
          requiredQuantity: item.quantity,
          availableCount: inventoryItems.length,
        },
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
  const result = await prisma.$transaction(
    async (tx) => {
      const latestOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          paymentRecords: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!latestOrder) {
        return { ok: false as const, message: "订单不存在", status: 404 };
      }

      if (latestOrder.deliveryStatus === "delivered") {
        const deliveryItems = await tx.deliveryItem.findMany({
          where: { orderId: latestOrder.id },
          orderBy: { createdAt: "asc" },
          select: { content: true },
        });

        return {
          ok: true as const,
          message: "订单已发货，无需重复处理",
          orderNo: latestOrder.orderNo,
          deliveryItems: deliveryItems.map((item) => item.content),
        };
      }

      if (latestOrder.paymentStatus !== "paid") {
        return {
          ok: false as const,
          message: `订单尚未支付，不能确认发货。当前支付状态：${latestOrder.paymentStatus}`,
          status: 400,
        };
      }

      if (latestOrder.deliveryStatus !== "pending") {
        return {
          ok: false as const,
          message: `订单不是待发货状态，不能确认发货。当前发货状态：${latestOrder.deliveryStatus}`,
          status: 400,
        };
      }

      const existingPaymentRecord =
        transactionId && latestOrder.paymentRecords.length > 0
          ? latestOrder.paymentRecords.find(
              (record) => record.transactionId === transactionId,
            ) || latestOrder.paymentRecords[0]
          : latestOrder.paymentRecords[0];

      const paymentData = {
        method: latestOrder.paymentMethod,
        amount: latestOrder.totalAmount,
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
            orderId: latestOrder.id,
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
          orderId: latestOrder.id,
          soldAt: now,
        },
      });

      if (soldResult.count !== allocations.length) {
        throw new Error("INVENTORY_CHANGED");
      }

      await tx.deliveryItem.createMany({
        data: allocations.map((allocation) => ({
          orderId: latestOrder.id,
          orderItemId: allocation.orderItemId,
          inventoryItemId: allocation.inventoryItemId,
          content: allocation.content,
        })),
      });

      await tx.order.update({
        where: { id: latestOrder.id },
        data: {
          paymentStatus: "paid",
          deliveryStatus: "delivered",
          orderStatus: "completed",
          paidAt: latestOrder.paidAt ?? now,
          deliveredAt: now,
          autoDeliveryStatus: "success",
          autoDeliveryMessage: note,
          autoDeliveryAttemptedAt: now,
        },
      });

      return {
        ok: true as const,
        message: "确认发货成功",
        orderNo: latestOrder.orderNo,
        deliveryItems: allocations.map((item) => item.content),
      };
    },
    {
      timeout: 15000,
    },
  );

  return result;
}

export function isInventoryChangedError(error: unknown) {
  return error instanceof Error && error.message === "INVENTORY_CHANGED";
}
