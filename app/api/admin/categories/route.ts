import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  isUniqueConstraintError,
  parseCategoryForm,
  redirectTo,
  requireAdmin,
  validateCategoryForm,
} from "./category-form";

export async function POST(request: Request) {
  const authRedirect = requireAdmin(request);
  if (authRedirect) {
    return authRedirect;
  }

  const formData = await request.formData();
  const data = parseCategoryForm(formData);
  const validationError = validateCategoryForm(data);

  if (validationError) {
    return NextResponse.json(
      { ok: false, message: validationError },
      { status: 400 },
    );
  }

  try {
    await prisma.category.create({ data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { ok: false, message: "分类 slug 已存在，请更换后重试" },
        { status: 400 },
      );
    }

    console.error("Create product category failed", error);
    return NextResponse.json(
      { ok: false, message: "商品分类创建失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/categories");
}
