import Stripe from "stripe";
import { Prisma } from "@prisma/client";

export const paymentGatewayConfig = {
  provider: process.env.PAYMENT_PROVIDER || "manual",
  currency: (process.env.PAYMENT_CURRENCY || "cny").toLowerCase(),
  gatewayName: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_NAME || "Stripe Checkout",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export function isStripePaymentEnabled() {
  return (
    paymentGatewayConfig.provider === "stripe" &&
    paymentGatewayConfig.stripeSecretKey.length > 0
  );
}

export function getStripeClient() {
  if (!isStripePaymentEnabled()) {
    throw new Error("Stripe payment gateway is not configured");
  }

  return new Stripe(paymentGatewayConfig.stripeSecretKey);
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, paymentGatewayConfig.siteUrl).toString();
}

export function toMinorUnit(amount: Prisma.Decimal | number) {
  const value = amount instanceof Prisma.Decimal ? amount.toNumber() : amount;

  return Math.round(value * 100);
}
