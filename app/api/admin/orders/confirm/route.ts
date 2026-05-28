import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  confirmPaymentAndDeliverOrder,
  isInventoryChangedError,
} from "@/lib/order-delivery";

type ConfirmBody = {
  orderNo?: unknown;
};

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

  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";

  if (!getAdminSession()) {
    return jsonError("未登录或登录已过期", 401);
  }
  if (!orderNo) {
    return jsonError("订单号不能为空");
  }

  try {
    const result = await confirmPaymentAndDeliverOrder({
      orderNo,
      note: "后台人工确认发货",
    });

    if (!result.ok) {
      return jsonError(result.message, result.status);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isInventoryChangedError(error)) {
      return jsonError("库存状态已变化，请刷新后重试");
    }

    return jsonError("确认发货失败，请稍后重试", 500);
  }
}
