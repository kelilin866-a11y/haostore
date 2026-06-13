import { NextResponse, type NextRequest } from "next/server";

import { queryNezhaPaymentAndSync } from "@/lib/payments/nezha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QueryBody = {
  orderNo?: unknown;
};

export async function POST(request: NextRequest) {
  let body: QueryBody;

  try {
    body = (await request.json()) as QueryBody;
  } catch {
    return NextResponse.json(
      { ok: false, paid: false, message: "请求内容不是有效 JSON" },
      { status: 400 },
    );
  }

  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";

  if (!orderNo) {
    return NextResponse.json(
      { ok: false, paid: false, message: "订单号不能为空" },
      { status: 400 },
    );
  }

  const result = await queryNezhaPaymentAndSync(orderNo);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
