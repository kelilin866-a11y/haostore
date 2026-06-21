import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleStatus, ProductStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type FaqItem = {
  question: string;
  answer: string;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "未发布";
  }

  return date.toLocaleDateString("zh-CN");
}

function getFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is FaqItem =>
      typeof item === "object" &&
      item !== null &&
      "question" in item &&
      "answer" in item &&
      typeof item.question === "string" &&
      typeof item.answer === "string",
  );
}

function renderContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("### ")) {
        return (
          <h3 key={block} className="text-lg font-semibold text-primary">
            {block.replace(/^###\s+/, "")}
          </h3>
        );
      }

      if (block.startsWith("## ")) {
        return (
          <h2 key={block} className="text-2xl font-semibold text-primary">
            {block.replace(/^##\s+/, "")}
          </h2>
        );
      }

      return (
        <p key={block} className="text-sm leading-7 text-slate-600">
          {block}
        </p>
      );
    });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await prisma.article.findFirst({
    where: {
      slug: params.slug,
      status: ArticleStatus.published,
    },
    select: {
      title: true,
      seoTitle: true,
      seoDescription: true,
      canonical: true,
    },
  });

  if (!article) {
    return {};
  }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || undefined,
    alternates: {
      canonical: article.canonical || `/blog/${params.slug}`,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await prisma.article.findFirst({
    where: {
      slug: params.slug,
      status: ArticleStatus.published,
    },
    include: {
      category: true,
    },
  });

  if (!article) {
    notFound();
  }

  const [relatedArticles, relatedProducts] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: ArticleStatus.published,
        slug: { not: article.slug },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: { slug: true, title: true },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.active },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
      select: { slug: true, title: true, summary: true },
    }),
  ]);

  const faqItems = getFaqItems(article.faqJson);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="deal">{article.category.name}</Badge>
            <span className="text-sm text-slate-500">
              发布时间：{formatDate(article.publishedAt ?? article.createdAt)}
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl">
            {article.title}
          </h1>

          <div className="mt-8 flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-white text-center text-sm text-slate-400">
            图片占位：{article.title}
          </div>

          <div className="mt-8 space-y-6">{renderContent(article.content)}</div>

          {faqItems.length > 0 ? (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {faqItems.map((faq) => (
                  <div key={faq.question}>
                    <h3 className="font-semibold text-primary">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </article>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>相关文章</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {relatedArticles.length === 0 ? (
                <p className="text-sm text-slate-500">暂无相关文章</p>
              ) : (
                relatedArticles.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="text-sm font-medium leading-6 text-primary hover:text-accentblue"
                  >
                    {item.title}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>相关商品推荐</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {relatedProducts.length === 0 ? (
                <p className="text-sm text-slate-500">暂无推荐商品</p>
              ) : (
                relatedProducts.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${encodeURIComponent(product.slug)}`}
                    className="rounded-md border border-slate-200 p-3 text-sm hover:border-teal-200 hover:bg-teal-50"
                  >
                    <span className="font-semibold text-primary">
                      {product.title}
                    </span>
                    <span className="mt-1 block leading-6 text-slate-500">
                      {product.summary || "查看商品详情"}
                    </span>
                  </Link>
                ))
              )}
              <Button variant="outline" asChild>
                <Link href="/products">查看全部商品</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
