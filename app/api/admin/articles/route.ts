import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  getPublishedAt,
  isUniqueConstraintError,
  parseArticleForm,
  redirectTo,
  requireAdmin,
  validateArticleForm,
} from "./article-form";

export async function POST(request: Request) {
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
    await prisma.article.create({
      data: {
        categoryId: data.categoryId,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        coverImage: data.coverImage,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: data.status,
        canonical: `/blog/${data.slug}`,
        publishedAt: getPublishedAt(data.status, null, data.publishedAt),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { ok: false, message: "文章 slug 已存在，请更换后重试" },
        { status: 400 },
      );
    }

    console.error("Create article failed", error);
    return NextResponse.json(
      { ok: false, message: "文章创建失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/articles");
}
