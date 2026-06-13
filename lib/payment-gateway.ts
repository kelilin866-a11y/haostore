import Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const paymentGatewayConfig = {
  provider: process.env.PAYMENT_PROVIDER || "manual",
  currency: (process.env.PAYMENT_CURRENCY || "cny").toLowerCase(),
  gatewayName: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_NAME || "Stripe Checkout",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

function parseEnabledFlag(value: string | null | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  return value.trim().toLowerCase() === "true";
}

export async function getStripeEnabledFlag() {
  const setting = await prisma.setting.findUnique({
    where: { key: "stripe_enabled" },
    select: { value: true },
  });

  return parseEnabledFlag(
    setting?.value,
    parseEnabledFlag(process.env.STRIPE_ENABLED, true),
  );
}

export async function isStripePaymentEnabled() {
  const stripeEnabled = await getStripeEnabledFlag();

  return (
    stripeEnabled &&
    paymentGatewayConfig.provider === "stripe" &&
    paymentGatewayConfig.stripeSecretKey.length > 0
  );
}

export async function getStripeCheckoutConfigIssues() {
  const issues: string[] = [];
  const stripeEnabled = await getStripeEnabledFlag();

  if (!stripeEnabled) {
    issues.push("STRIPE_ENABLED / stripe_enabled 已停用");
  }
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
  if (
    paymentGatewayConfig.provider !== "stripe" ||
    !paymentGatewayConfig.stripeSecretKey
  ) {
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
