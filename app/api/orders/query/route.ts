import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type QueryBody = {
  orderNo?: unknown;
  contact?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  let body: QueryBody;

  try {
    body = (await request.json()) as QueryBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";

  if (!orderNo || !contact) {
    return jsonError("请填写订单号和联系方式");
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      deliveryItems: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          orderItemId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    return jsonError("订单不存在", 404);
  }

  if (order.contact !== contact) {
    return jsonError("订单号或联系方式错误", 403);
  }

  const isDelivered = order.deliveryStatus === "delivered";

  return NextResponse.json({
    ok: true,
    order: {
      orderNo: order.orderNo,
      contact: order.contact,
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productTitleSnapshot,
        variantName: item.variantNameSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceSnapshot),
        subtotal: Number(item.subtotal),
      })),
      deliveryItems: isDelivered
        ? order.deliveryItems.map((item) => ({
            id: item.id,
            content: item.content,
            orderItemId: item.orderItemId,
            createdAt: item.createdAt,
          }))
        : [],
    },
  });
}
