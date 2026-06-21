import { NextResponse } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";

export type ParsedArticleForm = {
  categoryId: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: Date | null;
  status: ArticleStatus;
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

  return redirectTo("/admin/login?next=/admin/articles");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseArticleStatus(value: string) {
  if (value === ArticleStatus.published) {
    return ArticleStatus.published;
  }

  if (value === ArticleStatus.archived) {
    return ArticleStatus.archived;
  }

  return ArticleStatus.draft;
}

function parseShanghaiDateTimeLocal(value: string) {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  const timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 8,
    Number(minute),
    Number(second),
  );
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseArticleForm(formData: FormData): ParsedArticleForm {
  return {
    categoryId: getFormString(formData, "categoryId"),
    title: getFormString(formData, "title"),
    slug: getFormString(formData, "slug"),
    summary: getFormString(formData, "summary"),
    content: getFormString(formData, "content"),
    coverImage: getFormString(formData, "coverImage"),
    seoTitle: getFormString(formData, "seoTitle"),
    seoDescription: getFormString(formData, "seoDescription"),
    publishedAt: parseShanghaiDateTimeLocal(getFormString(formData, "publishedAt")),
    status: parseArticleStatus(getFormString(formData, "status")),
  };
}

export function validateArticleForm(data: ParsedArticleForm) {
  if (!data.categoryId || !data.title || !data.slug || !data.content) {
    return "标题、slug、分类和正文内容不能为空";
  }

  return null;
}

export function getPublishedAt(
  status: ArticleStatus,
  current?: Date | null,
  requested?: Date | null,
) {
  if (status === ArticleStatus.published) {
    return requested ?? current ?? new Date();
  }

  return requested ?? null;
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
