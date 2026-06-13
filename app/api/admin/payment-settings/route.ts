import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

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

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return redirectTo("/admin/login?next=/admin/payment-settings");
  }

  const formData = await request.formData();
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
    const value = getFormString(formData, key);

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
    return redirectTo("/admin/payment-settings?error=1");
  }

  return redirectTo("/admin/payment-settings?saved=1");
}
