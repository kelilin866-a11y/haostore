import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type QueryBody = {
  orderNo?: unknown;
  contact?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function mapOrder(order: Awaited<ReturnType<typeof findOrders>>[number]) {
  const isDelivered = order.deliveryStatus === "delivered";

  return {
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
  };
}

async function findOrders({
  orderNo,
  contact,
}: {
  orderNo: string;
  contact: string;
}) {
  return prisma.order.findMany({
    where: orderNo
      ? { orderNo }
      : {
          contact,
        },
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
    orderBy: { createdAt: "desc" },
  });
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

  if (!orderNo && !contact) {
    return jsonError("请输入订单号或联系方式");
  }

  const orders = await findOrders({ orderNo, contact });

  if (orders.length === 0) {
    return jsonError("订单不存在", 404);
  }

  return NextResponse.json({
    ok: true,
    orders: orders.map(mapOrder),
  });
}
