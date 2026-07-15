import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/site/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { getVisiblePublishedArticleWhere } from "@/lib/article-visibility";
import { prisma } from "@/lib/db";
import { parseArticleTags } from "@/lib/seo-content";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) {
    return "未发布";
  }

  return date.toLocaleDateString("zh-CN");
}

export function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Metadata {
  const tag = decodeURIComponent(params.tag);

  return {
    title: `${tag}相关文章 - 好贸Go`,
    description: `查看好贸Go关于${tag}的教程、购买指南和常见问题。`,
    alternates: {
      canonical: `/blog/tags/${encodeURIComponent(tag)}`,
    },
  };
}

export default async function BlogTagPage({
  params,
}: {
  params: { tag: string };
}) {
  const tag = decodeURIComponent(params.tag).trim();

  if (!tag) {
    notFound();
  }

  const candidates = await prisma.article.findMany({
    where: {
      ...getVisiblePublishedArticleWhere(),
      seoKeywords: { contains: tag },
    },
    include: { category: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  const articles = candidates.filter((article) =>
    parseArticleTags(article.seoKeywords).includes(tag),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Badge variant="deal" className="px-3 py-1">
          #{tag}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-primary">
          {tag}相关文章
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          聚合展示与 {tag} 相关的账号教程、购买指南、常见问题和售后说明。
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          暂无该标签下的已发布文章。
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={{
                slug: article.slug,
                title: article.title,
                category: article.category.name,
                date: formatDate(article.publishedAt ?? article.createdAt),
                excerpt: article.summary ?? "暂无摘要",
                keyword: article.seoKeywords,
                tags: parseArticleTags(article.seoKeywords),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
