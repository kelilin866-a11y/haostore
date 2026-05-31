import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";

export type ParsedCategoryForm = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export function redirectTo(path: string, request: Request) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export function requireAdmin(request: Request) {
  if (getAdminSession()) {
    return null;
  }

  return redirectTo("/admin/login?next=/admin/categories", request);
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseCategoryForm(formData: FormData): ParsedCategoryForm {
  const sortOrder = Number(getFormString(formData, "sortOrder") || 0);

  return {
    name: getFormString(formData, "name"),
    slug: getFormString(formData, "slug"),
    description: getFormString(formData, "description"),
    sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
    isActive: Boolean(formData.get("isActive")),
  };
}

export function validateCategoryForm(data: ParsedCategoryForm) {
  if (!data.name || !data.slug) {
    return "分类名称和 slug 不能为空";
  }

  return null;
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
