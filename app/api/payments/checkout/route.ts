import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import {
  getAbsoluteUrl,
  getStripeClient,
  getStripeCheckoutConfigIssues,
  isStripePaymentEnabled,
  paymentGatewayConfig,
  toMinorUnit,
} from "@/lib/payment-gateway";

type CheckoutBody = {
  orderId?: unknown;
  orderNo?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getStripeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return `Stripe Checkout 创建失败：${error.message}`;
  }

  return "Stripe Checkout 创建失败，请检查服务端日志和 Stripe 配置";
}

export async function POST(request: Request) {
  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";

  if (!orderNo && !orderId) {
    return jsonError("订单号或订单 ID 不能为空");
  }
  const configIssues = await getStripeCheckoutConfigIssues();
  if (!(await isStripePaymentEnabled()) || configIssues.length > 0) {
    console.error("[payments/checkout] Stripe config invalid", configIssues);
    return jsonError(`在线支付配置不完整：${configIssues.join("；")}`, 503);
  }

  const order = await prisma.order.findFirst({
    where: orderNo ? { orderNo } : { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return jsonError("订单不存在", 404);
  }
  if (order.paymentStatus === "paid" || order.deliveryStatus === "delivered") {
    return NextResponse.json({
      ok: true,
      redirectUrl: getAbsoluteUrl(`/order/${order.orderNo}/pay`),
    });
  }
  if (order.items.length === 0) {
    return jsonError("订单没有商品明细");
  }

  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: paymentGatewayConfig.currency,
      unit_amount: toMinorUnit(item.unitPriceSnapshot),
      product_data: {
        name: `${item.productTitleSnapshot} - ${item.variantNameSnapshot}`,
      },
    },
  }));
  const invalidLineItem = lineItems.find(
    (item) =>
      !Number.isInteger(item.price_data.unit_amount) ||
      item.price_data.unit_amount <= 0,
  );

  if (invalidLineItem) {
    console.error("[payments/checkout] Invalid Stripe line item amount", {
      orderNo: order.orderNo,
      unitAmount: invalidLineItem.price_data.unit_amount,
    });
    return jsonError("订单金额无效，无法创建在线支付", 400);
  }

  const stripe = getStripeClient();
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.orderNo,
      success_url: getAbsoluteUrl(`/order/${order.orderNo}/pay?payment=success`),
      cancel_url: getAbsoluteUrl(`/order/${order.orderNo}/pay?payment=cancelled`),
      metadata: {
        orderId: order.id,
        orderNo: order.orderNo,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
        },
      },
      customer_email:
        order.contact.includes("@") && !order.contact.startsWith("@")
          ? order.contact
          : undefined,
      line_items: lineItems,
    });
  } catch (error) {
    console.error("[payments/checkout] Stripe Checkout session creation failed", {
      orderNo: order.orderNo,
      error,
    });
    return jsonError(getStripeErrorMessage(error), 502);
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "gateway_reserved",
      },
    }),
    prisma.paymentRecord.create({
      data: {
        orderId: order.id,
        method: "gateway_reserved",
        amount: order.totalAmount,
        status: "pending",
        transactionId: session.id,
        note: "Stripe Checkout session created",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
  });
}
