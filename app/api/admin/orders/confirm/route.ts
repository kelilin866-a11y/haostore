import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  confirmPaymentAndDeliverOrder,
  isInventoryChangedError,
} from "@/lib/order-delivery";

type ConfirmBody = {
  orderNo?: unknown;
};

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

export async function POST(request: Request) {
  let body: ConfirmBody;

  try {
    body = (await request.json()) as ConfirmBody;
  } catch (error) {
    console.error("[admin/orders/confirm] Invalid JSON body", error);
    return jsonError("请求内容不是有效 JSON");
  }

  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";

  if (!getAdminSession()) {
    console.error("[admin/orders/confirm] Missing admin session", { orderNo });
    return jsonError("未登录或登录已过期", 401);
  }

  if (!orderNo) {
    console.error("[admin/orders/confirm] Missing orderNo");
    return jsonError("订单号不能为空");
  }

  console.log("[admin/orders/confirm] Confirm delivery requested", { orderNo });

  try {
    const result = await confirmPaymentAndDeliverOrder({
      orderNo,
      note: "后台人工确认发货",
    });

    if (!result.ok) {
      console.error("[admin/orders/confirm] Confirm delivery rejected", result);
      return jsonError(result.message, result.status, result.details);
    }

    console.log("[admin/orders/confirm] Confirm delivery succeeded", {
      orderNo: result.orderNo,
      deliveryCount: result.deliveryItems.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (isInventoryChangedError(error)) {
      console.error("[admin/orders/confirm] Inventory changed during delivery", {
        orderNo,
        error,
      });
      return jsonError("库存状态已变化，请刷新后重试");
    }

    console.error("[admin/orders/confirm] Confirm delivery failed", {
      orderNo,
      error,
    });
    return jsonError(
      error instanceof Error
        ? `确认发货失败：${error.message}`
        : "确认发货失败，请稍后重试",
      500,
    );
  }
}
