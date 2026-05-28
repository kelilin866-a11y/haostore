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

export function getStripeCheckoutConfigIssues() {
  const issues: string[] = [];

  if (paymentGatewayConfig.provider !== "stripe") {
    issues.push("PAYMENT_PROVIDER 必须设置为 stripe");
  }
  if (!paymentGatewayConfig.stripeSecretKey) {
    issues.push("STRIPE_SECRET_KEY 未配置");
  } else if (
    !paymentGatewayConfig.stripeSecretKey.startsWith("sk_") ||
    paymentGatewayConfig.stripeSecretKey.length < 20
  ) {
    issues.push("STRIPE_SECRET_KEY 不是有效的 Stripe secret key");
  }
  if (!/^[a-z]{3}$/.test(paymentGatewayConfig.currency)) {
    issues.push("PAYMENT_CURRENCY 必须是三位小写货币代码，例如 cny");
  }

  try {
    const url = new URL(paymentGatewayConfig.siteUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      issues.push("NEXT_PUBLIC_SITE_URL 必须是完整 http 或 https URL");
    }
  } catch {
    issues.push("NEXT_PUBLIC_SITE_URL 必须是完整 URL，例如 http://localhost:3000");
  }

  return issues;
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
