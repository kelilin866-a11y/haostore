import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  getPublishedAt,
  isUniqueConstraintError,
  parseArticleForm,
  redirectTo,
  requireAdmin,
  validateArticleForm,
} from "../article-form";

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
  const data = parseArticleForm(formData);
  const validationError = validateArticleForm(data);

  if (validationError) {
    return NextResponse.json(
      { ok: false, message: validationError },
      { status: 400 },
    );
  }

  try {
    const currentArticle = await prisma.article.findUnique({
      where: { id: params.id },
      select: { publishedAt: true },
    });

    if (!currentArticle) {
      return NextResponse.json(
        { ok: false, message: "文章不存在" },
        { status: 404 },
      );
    }

    await prisma.article.update({
      where: { id: params.id },
      data: {
        categoryId: data.categoryId,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: data.status,
        canonical: `/blog/${data.slug}`,
        publishedAt: getPublishedAt(data.status, currentArticle.publishedAt),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { ok: false, message: "文章 slug 已存在，请更换后重试" },
        { status: 400 },
      );
    }

    console.error("Update article failed", error);
    return NextResponse.json(
      { ok: false, message: "文章更新失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/articles", request);
}
