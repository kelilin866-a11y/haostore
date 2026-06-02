import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type DeliveryContentBody = {
  orderNo?: unknown;
  deliveryContent?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getDeliveryLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return jsonError("未登录或登录已过期", 401);
  }

  let body: DeliveryContentBody;

  try {
    body = (await request.json()) as DeliveryContentBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";
  const deliveryContent =
    typeof body.deliveryContent === "string" ? body.deliveryContent : "";

  if (!orderNo) {
    return jsonError("订单号不能为空");
  }

  const lines = getDeliveryLines(deliveryContent);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: {
        deliveryItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return jsonError("订单不存在", 404);
    }

    if (order.deliveryStatus !== "delivered") {
      return jsonError("订单尚未发货，不能编辑发货内容");
    }

    if (order.deliveryItems.length === 0) {
      return jsonError("订单没有已分配的发货内容");
    }

    if (lines.length !== order.deliveryItems.length) {
      return jsonError(
        `发货内容行数需要与已分配库存数量一致：当前需要 ${order.deliveryItems.length} 行`,
      );
    }

    for (let index = 0; index < order.deliveryItems.length; index += 1) {
      const item = order.deliveryItems[index];
      await tx.deliveryItem.update({
        where: { id: item.id },
        data: { content: lines[index] },
      });
    }

    return NextResponse.json({ ok: true, message: "发货内容已保存" });
  });
}
