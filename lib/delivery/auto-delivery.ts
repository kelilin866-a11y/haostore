import { prisma } from "@/lib/db";
import { deliverLocalStockOrder } from "@/lib/delivery/local-stock-delivery";
import { deliverSupplier8877Order } from "@/lib/delivery/supplier-8877";

type AutoDeliverySource =
  | "stripe_webhook"
  | "nezha_webhook"
  | "nezha_query"
  | "epay_webhook"
  | "admin_retry";

type AutoDeliveryResult =
  | {
      ok: true;
      message: string;
      status: "success" | "skipped";
    }
  | {
      ok: false;
      message: string;
      status: "failed";
    };

async function markAutoDeliveryFailure(orderNo: string, message: string) {
  await prisma.order.update({
    where: { orderNo },
    data: {
      autoDeliveryStatus: "failed",
      autoDeliveryMessage: message,
      autoDeliveryAttemptedAt: new Date(),
    },
  });
}

async function markAutoDeliverySkipped(orderNo: string, message: string) {
  await prisma.order.update({
    where: { orderNo },
    data: {
      autoDeliveryStatus: "skipped",
      autoDeliveryMessage: message,
      autoDeliveryAttemptedAt: new Date(),
    },
  });
}

async function writeAutoDeliveryLog({
  orderId,
  orderNo,
  source,
  success,
  message,
}: {
  orderId?: string;
  orderNo: string;
  source: AutoDeliverySource;
  success: boolean;
  message: string;
}) {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId: orderId || null,
        orderNo,
        provider: "auto_delivery",
        channel: source,
        event: success ? "delivery" : "error",
        success,
        message,
      },
    });
  } catch (error) {
    console.error("[auto-delivery] failed to write log", { orderNo, error });
  }
}

export async function autoDeliverPaidOrder(
  orderNo: string,
  source: AutoDeliverySource,
): Promise<AutoDeliveryResult> {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: true,
          variant: {
            select: {
              id: true,
              sku: true,
            },
          },
        },
      },
      deliveryItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return { ok: false, status: "failed", message: "订单不存在" };
  }

  if (order.paymentStatus !== "paid") {
    const message = `订单尚未付款，当前支付状态：${order.paymentStatus}`;
    await markAutoDeliverySkipped(orderNo, message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message,
    });
    return { ok: true, status: "skipped", message };
  }

  if (order.deliveryStatus === "delivered") {
    const message = "订单已发货，无需重复自动发货";
    await prisma.order.update({
      where: { id: order.id },
      data: {
        autoDeliveryStatus: "success",
        autoDeliveryMessage: message,
        autoDeliveryAttemptedAt: new Date(),
      },
    });
    return { ok: true, status: "skipped", message };
  }

  if (order.deliveryStatus !== "pending") {
    const message = `订单不是待发货状态，当前发货状态：${order.deliveryStatus}`;
    await markAutoDeliverySkipped(orderNo, message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message,
    });
    return { ok: true, status: "skipped", message };
  }

  if (order.items.length === 0) {
    const message = "订单没有商品明细，无法自动发货";
    await markAutoDeliveryFailure(orderNo, message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message,
    });
    return { ok: false, status: "failed", message };
  }

  const deliveryModes = new Set(
    order.items.map((item) => item.product.deliveryMode || "local_stock"),
  );

  if (deliveryModes.size > 1) {
    const message = "订单包含多种发货模式，需后台人工处理";
    await markAutoDeliveryFailure(orderNo, message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message,
    });
    return { ok: false, status: "failed", message };
  }

  const deliveryMode = Array.from(deliveryModes)[0];

  if (deliveryMode === "manual") {
    const message = "商品为人工发货模式，需后台人工处理";
    await markAutoDeliverySkipped(orderNo, message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message,
    });
    return { ok: true, status: "skipped", message };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      autoDeliveryStatus: "processing",
      autoDeliveryMessage: null,
      autoDeliveryAttemptedAt: new Date(),
    },
  });

  if (deliveryMode === "supplier_api") {
    const result = await deliverSupplier8877Order(order);

    if (!result.ok) {
      await markAutoDeliveryFailure(orderNo, result.message);
      await writeAutoDeliveryLog({
        orderId: order.id,
        orderNo,
        source,
        success: false,
        message: result.message,
      });
      return { ok: false, status: "failed", message: result.message };
    }

    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: true,
      message: result.message,
    });
    return { ok: true, status: "success", message: result.message };
  }

  const result = await deliverLocalStockOrder(orderNo);

  if (!result.ok) {
    await markAutoDeliveryFailure(orderNo, result.message);
    await writeAutoDeliveryLog({
      orderId: order.id,
      orderNo,
      source,
      success: false,
      message: result.message,
    });
    return { ok: false, status: "failed", message: result.message };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      autoDeliveryStatus: "success",
      autoDeliveryMessage: result.message,
      autoDeliveryAttemptedAt: new Date(),
    },
  });
  await writeAutoDeliveryLog({
    orderId: order.id,
    orderNo,
    source,
    success: true,
    message: result.message,
  });

  return { ok: true, status: "success", message: result.message };
}

export function scheduleAutoDeliveryAfterPayment(
  orderNo: string,
  source: AutoDeliverySource,
) {
  void autoDeliverPaidOrder(orderNo, source).catch(async (error) => {
    const message =
      error instanceof Error ? error.message : "自动发货发生未知错误";
    console.error("[auto-delivery] failed", { orderNo, source, error });
    try {
      await markAutoDeliveryFailure(orderNo, message);
      await writeAutoDeliveryLog({
        orderNo,
        source,
        success: false,
        message,
      });
    } catch (logError) {
      console.error("[auto-delivery] failed to record failure", {
        orderNo,
        logError,
      });
    }
  });
}
