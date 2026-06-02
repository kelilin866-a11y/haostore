import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { editableSettingFields } from "@/lib/site-settings";

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
    return redirectTo("/admin/login?next=/admin/settings");
  }

  const formData = await request.formData();

  try {
    await prisma.$transaction(
      editableSettingFields.map((field) =>
        prisma.setting.upsert({
          where: { key: field.key },
          create: {
            key: field.key,
            value: getFormString(formData, field.key),
          },
          update: {
            value: getFormString(formData, field.key),
          },
        }),
      ),
    );
  } catch (error) {
    console.error("Save site settings failed", error);
    return redirectTo("/admin/settings?error=1");
  }

  return redirectTo("/admin/settings?saved=1");
}
