import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type OrderStatusRouteProps = {
  params: {
    orderNo: string;
  };
};

export async function GET(_request: Request, { params }: OrderStatusRouteProps) {
  const orderNo = decodeURIComponent(params.orderNo || "").trim();

  if (!orderNo) {
    return NextResponse.json(
      { ok: false, message: "订单号不能为空" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      totalAmount: true,
      paymentStatus: true,
      orderStatus: true,
      deliveryStatus: true,
      paidAt: true,
      deliveredAt: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, message: "订单不存在" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderNo: order.orderNo,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    deliveryStatus: order.deliveryStatus,
    paidAt: order.paidAt,
    paidAtText: formatDateTime(order.paidAt),
    deliveredAt: order.deliveredAt,
    deliveredAtText: formatDateTime(order.deliveredAt),
    totalAmount: Number(order.totalAmount),
    totalAmountText: formatCurrency(Number(order.totalAmount)),
  });
}
