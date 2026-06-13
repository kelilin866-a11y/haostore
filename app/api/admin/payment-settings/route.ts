import { NextResponse } from "next/server";
import crypto from "crypto";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { normalizePemKey } from "@/lib/payments/nezha";

const editablePaymentSettingKeys = [
  "nezha_pay_enabled",
  "nezha_pay_gateway",
  "nezha_pay_pid",
  "nezha_pay_return_url",
  "nezha_pay_notify_url",
  "default_alipay_provider",
  "default_wxpay_provider",
] as const;

const secretPaymentSettingKeys = [
  "nezha_pay_private_key",
  "nezha_pay_platform_public_key",
] as const;

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(code: string) {
  return redirectTo(`/admin/payment-settings?error=${encodeURIComponent(code)}`);
}

function canParsePrivateKey(value: string) {
  try {
    crypto.createPrivateKey(normalizePemKey(value));
    return true;
  } catch {
    return false;
  }
}

function canParsePublicKey(value: string) {
  try {
    crypto.createPublicKey(normalizePemKey(value));
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return redirectTo("/admin/login?next=/admin/payment-settings");
  }

  const formData = await request.formData();
  const newPrivateKey = getFormString(formData, "nezha_pay_private_key");
  const newPlatformPublicKey = getFormString(
    formData,
    "nezha_pay_platform_public_key",
  );

  if (newPrivateKey && !canParsePrivateKey(newPrivateKey)) {
    return redirectWithError("private-key");
  }

  if (newPlatformPublicKey && !canParsePublicKey(newPlatformPublicKey)) {
    return redirectWithError("public-key");
  }

  const operations = [
    ...editablePaymentSettingKeys.map((key) =>
      prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: getFormString(formData, key),
        },
        update: {
          value: getFormString(formData, key),
        },
      }),
    ),
  ];

  for (const key of secretPaymentSettingKeys) {
    const value =
      key === "nezha_pay_private_key" ? newPrivateKey : newPlatformPublicKey;

    if (!value) {
      continue;
    }

    operations.push(
      prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value,
        },
        update: {
          value,
        },
      }),
    );
  }

  try {
    await prisma.$transaction(operations);
  } catch (error) {
    console.error("Save payment settings failed", {
      error: error instanceof Error ? error.message : error,
    });
    return redirectWithError("save");
  }

  return redirectTo("/admin/payment-settings?saved=1");
}
