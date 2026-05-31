import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";

export type ParsedArticleCategoryForm = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

export function requireAdmin(request: Request) {
  if (getAdminSession()) {
    return null;
  }

  return redirectTo("/admin/login?next=/admin/article-categories");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseArticleCategoryForm(
  formData: FormData,
): ParsedArticleCategoryForm {
  const sortOrder = Number(getFormString(formData, "sortOrder") || 0);

  return {
    name: getFormString(formData, "name"),
    slug: getFormString(formData, "slug"),
    description: getFormString(formData, "description"),
    sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
    isActive: Boolean(formData.get("isActive")),
  };
}

export function validateArticleCategoryForm(data: ParsedArticleCategoryForm) {
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
