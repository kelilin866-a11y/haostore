import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  isUniqueConstraintError,
  parseArticleCategoryForm,
  redirectTo,
  requireAdmin,
  validateArticleCategoryForm,
} from "../article-category-form";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  const authRedirect = requireAdmin(request);
  if (authRedirect) {
    return authRedirect;
  }

  const formData = await request.formData();
  const data = parseArticleCategoryForm(formData);
  const validationError = validateArticleCategoryForm(data);

  if (validationError) {
    return NextResponse.json(
      { ok: false, message: validationError },
      { status: 400 },
    );
  }

  try {
    await prisma.articleCategory.update({
      where: { id: params.id },
      data,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { ok: false, message: "文章分类 slug 已存在，请更换后重试" },
        { status: 400 },
      );
    }

    console.error("Update article category failed", error);
    return NextResponse.json(
      { ok: false, message: "文章分类更新失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/article-categories");
}
