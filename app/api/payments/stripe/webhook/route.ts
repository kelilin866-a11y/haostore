import { NextResponse } from "next/server";
import { PaymentMethod, Prisma } from "@prisma/client";
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

function getSessionOrderId(session: Stripe.Checkout.Session) {
  return session.metadata?.orderId || "";
}

function getSessionTransactionId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.id;
}

async function markOrderPaid({
  orderNo,
  orderId,
  transactionId,
  note,
  checkoutSessionId,
}: {
  orderNo?: string;
  orderId?: string;
  transactionId: string;
  note: string;
  checkoutSessionId?: string;
}) {
  const orderLookup: Prisma.OrderWhereInput[] = [];

  if (orderNo) {
    orderLookup.push({ orderNo });
  }
  if (orderId) {
    orderLookup.push({ id: orderId });
  }

  console.log("[stripe/webhook] resolving order", {
    orderNo,
    orderId,
    transactionId,
    checkoutSessionId,
  });

  if (orderLookup.length === 0) {
    console.error("[stripe/webhook] missing order metadata", {
      orderNo,
      orderId,
      transactionId,
      checkoutSessionId,
    });
    return {
      ok: false,
      message: "Stripe event is missing orderNo or orderId",
      status: 400,
    };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        OR: orderLookup,
      },
      include: {
        paymentRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      console.error("[stripe/webhook] order not found", {
        orderNo,
        orderId,
        transactionId,
        checkoutSessionId,
      });
      return { ok: false, message: "Order not found", status: 404 };
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

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        ...(order.orderStatus === "completed" ? {} : { orderStatus: "paid" }),
        paidAt: order.paidAt || new Date(),
      },
      select: {
        id: true,
        orderNo: true,
        paymentStatus: true,
        deliveryStatus: true,
        orderStatus: true,
        paidAt: true,
      },
    });

    console.log("[stripe/webhook] order update result", {
      orderId: updatedOrder.id,
      orderNo: updatedOrder.orderNo,
      paymentStatus: updatedOrder.paymentStatus,
      deliveryStatus: updatedOrder.deliveryStatus,
      orderStatus: updatedOrder.orderStatus,
      paidAt: updatedOrder.paidAt,
    });

    return { ok: true, orderNo: updatedOrder.orderNo };
  });
}

async function markCheckoutPaid(
  session: Stripe.Checkout.Session,
  eventType: string,
) {
  console.log("[stripe/webhook] checkout session received", {
    eventType,
    sessionId: session.id,
    metadata: session.metadata,
    orderNo: getSessionOrderNo(session),
    orderId: getSessionOrderId(session),
    paymentStatus: session.payment_status,
  });

  return markOrderPaid({
    orderNo: getSessionOrderNo(session),
    orderId: getSessionOrderId(session),
    transactionId: getSessionTransactionId(session),
    checkoutSessionId: session.id,
    note: `Stripe webhook: ${eventType}`,
  });
}

async function markPaymentIntentPaid(
  paymentIntent: Stripe.PaymentIntent,
  eventType: string,
) {
  console.log("[stripe/webhook] payment intent received", {
    eventType,
    paymentIntentId: paymentIntent.id,
    metadata: paymentIntent.metadata,
    orderNo: paymentIntent.metadata.orderNo || "",
    orderId: paymentIntent.metadata.orderId || "",
  });

  return markOrderPaid({
    orderNo: paymentIntent.metadata.orderNo || "",
    orderId: paymentIntent.metadata.orderId || "",
    transactionId: paymentIntent.id,
    note: `Stripe webhook: ${eventType}`,
  });
}

async function markCheckoutFailed(session: Stripe.Checkout.Session) {
  const orderNo = getSessionOrderNo(session);

  console.log("[stripe/webhook] checkout failed or expired", {
    sessionId: session.id,
    metadata: session.metadata,
    orderNo,
    orderId: getSessionOrderId(session),
  });

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
    console.error("[stripe/webhook] missing Stripe-Signature header");
    return jsonError("Missing Stripe signature", 400);
  }
  if (!paymentGatewayConfig.stripeWebhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
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
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed", {
      error: error instanceof Error ? error.message : error,
    });
    return jsonError("Stripe webhook signature verification failed", 400);
  }

  console.log("[stripe/webhook] received event", {
    type: event.type,
    id: event.id,
  });

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const result = await markCheckoutPaid(session, event.type);

      if (!result.ok) {
        console.error("[stripe/webhook] checkout paid handling failed", {
          eventType: event.type,
          sessionId: session.id,
          metadata: session.metadata,
          message: result.message,
        });
        return jsonError(
          result.message || "Stripe payment webhook handling failed",
          result.status,
        );
      }
    } else {
      console.log("[stripe/webhook] checkout session is not paid yet", {
        eventType: event.type,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
      });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const result = await markPaymentIntentPaid(paymentIntent, event.type);

    if (!result.ok) {
      console.error("[stripe/webhook] payment intent handling failed", {
        eventType: event.type,
        paymentIntentId: paymentIntent.id,
        metadata: paymentIntent.metadata,
        message: result.message,
      });
      return jsonError(
        result.message || "Stripe payment webhook handling failed",
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
