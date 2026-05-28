import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripeClient, paymentGatewayConfig } from "@/lib/payment-gateway";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getSessionOrderNo(session: Stripe.Checkout.Session) {
  return session.metadata?.orderNo || session.client_reference_id || "";
}

function getSessionTransactionId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.id;
}

async function markOrderPaid({
  orderNo,
  transactionId,
  note,
  checkoutSessionId,
}: {
  orderNo: string;
  transactionId: string;
  note: string;
  checkoutSessionId?: string;
}) {
  if (!orderNo) {
    return { ok: false, message: "Stripe 事件缺少订单号", status: 400 };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: {
        paymentRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return { ok: false, message: "订单不存在", status: 404 };
    }

    const knownTransactionIds = [transactionId, checkoutSessionId].filter(
      Boolean,
    );
    const existingRecord =
      order.paymentRecords.find((record) =>
        knownTransactionIds.includes(record.transactionId || ""),
      ) || order.paymentRecords[0];

    const paymentRecordData = {
      method: PaymentMethod.gateway_reserved,
      amount: order.totalAmount,
      status: "paid" as const,
      transactionId,
      note,
    };

    if (existingRecord) {
      await tx.paymentRecord.update({
        where: { id: existingRecord.id },
        data: paymentRecordData,
      });
    } else {
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          ...paymentRecordData,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        ...(order.orderStatus === "completed" ? {} : { orderStatus: "paid" }),
        paidAt: order.paidAt || new Date(),
      },
    });

    return { ok: true, orderNo: order.orderNo };
  });
}

async function markCheckoutPaid(
  session: Stripe.Checkout.Session,
  eventType: string,
) {
  return markOrderPaid({
    orderNo: getSessionOrderNo(session),
    transactionId: getSessionTransactionId(session),
    checkoutSessionId: session.id,
    note: `Stripe webhook: ${eventType}`,
  });
}

async function markPaymentIntentPaid(
  paymentIntent: Stripe.PaymentIntent,
  eventType: string,
) {
  return markOrderPaid({
    orderNo: paymentIntent.metadata.orderNo || "",
    transactionId: paymentIntent.id,
    note: `Stripe webhook: ${eventType}`,
  });
}

async function markCheckoutFailed(session: Stripe.Checkout.Session) {
  const orderNo = getSessionOrderNo(session);

  if (!orderNo) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true, totalAmount: true },
  });

  if (!order) {
    return;
  }

  await prisma.paymentRecord.create({
    data: {
      orderId: order.id,
      method: PaymentMethod.gateway_reserved,
      amount: order.totalAmount,
      status: "failed",
      transactionId: session.id,
      note: "Stripe Checkout payment failed or expired",
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("缺少 Stripe 签名", 400);
  }
  if (!paymentGatewayConfig.stripeWebhookSecret) {
    return jsonError("Stripe webhook secret is not configured", 500);
  }

  const stripe = getStripeClient();
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      paymentGatewayConfig.stripeWebhookSecret,
    );
  } catch {
    return jsonError("Stripe webhook 签名校验失败", 400);
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const result = await markCheckoutPaid(session, event.type);

      if (!result.ok) {
        return jsonError(
          result.message || "Stripe 支付回调处理失败",
          result.status,
        );
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const result = await markPaymentIntentPaid(paymentIntent, event.type);

    if (!result.ok) {
      return jsonError(
        result.message || "Stripe 支付回调处理失败",
        result.status,
      );
    }
  }

  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    await markCheckoutFailed(session);
  }

  return NextResponse.json({ ok: true, received: true });
}
