import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { autoDeliverPaidOrder } from "@/lib/delivery/auto-delivery";

type RetryDeliveryRouteProps = {
  params: {
    orderNo: string;
  };
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(_request: Request, { params }: RetryDeliveryRouteProps) {
  if (!getAdminSession()) {
    return jsonError("未登录或登录已过期", 401);
  }

  const orderNo = params.orderNo.trim();

  if (!orderNo) {
    return jsonError("订单号不能为空");
  }

  const result = await autoDeliverPaidOrder(orderNo, "admin_retry");

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
