import { NextResponse } from "next/server";

import {
  confirmPaymentAndDeliverOrder,
  isInventoryChangedError,
} from "@/lib/order-delivery";

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
    const result = await confirmPaymentAndDeliverOrder({
      orderNo,
      note: "后台人工确认付款",
    });

    if (!result.ok) {
      return jsonError(result.message, result.status);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isInventoryChangedError(error)) {
      return jsonError("库存状态已变化，请刷新后重试");
    }

    return jsonError("确认付款并发货失败，请稍后重试", 500);
  }
}
