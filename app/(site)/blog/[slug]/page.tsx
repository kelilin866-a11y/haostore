import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVisiblePublishedArticleWhere } from "@/lib/article-visibility";
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

function getHttpImageUrl(value: string | null | undefined) {
  const url = value?.trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  return url;
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

function renderInlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = value;
  let index = 0;

  while (remaining.length > 0) {
    const start = remaining.indexOf("**");

    if (start === -1) {
      nodes.push(remaining);
      break;
    }

    if (start > 0) {
      nodes.push(remaining.slice(0, start));
    }

    const afterStart = remaining.slice(start + 2);
    const end = afterStart.indexOf("**");

    if (end === -1) {
      nodes.push(remaining.slice(start));
      break;
    }

    const boldText = afterStart.slice(0, end);

    if (boldText) {
      nodes.push(
        <strong
          key={`${keyPrefix}-strong-${index}`}
          className="font-semibold text-slate-900"
        >
          {boldText}
        </strong>,
      );
    }

    remaining = afterStart.slice(end + 2);
    index += 1;
  }

  return nodes;
}

function splitInlineHeading(line: string) {
  const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

  if (!headingMatch) {
    return [line];
  }

  const [, marker, rawText] = headingMatch;
  const text = rawText.trim();
  const questionEnd = text.search(/[？?]/);

  if (questionEnd >= 0 && questionEnd < text.length - 1) {
    const title = text.slice(0, questionEnd + 1).trim();
    const rest = text.slice(questionEnd + 1).trim();

    return rest ? [`${marker} ${title}`, "", rest] : [`${marker} ${title}`];
  }

  const titleEndMatch = text.match(
    /^(.*?(?:开头说明|常见特点|常见问题|是什么|是什么意思|购买前需要注意什么|适合哪些使用场景|购买或使用前需要注意什么|相关入口))\s+(.+)$/,
  );

  if (titleEndMatch) {
    return [
      `${marker} ${titleEndMatch[1].trim()}`,
      "",
      titleEndMatch[2].trim(),
    ];
  }

  const paragraphStartMatch = text.match(
    /\s+(很多|这里|本文|本篇|这篇|可以理解|通常|建议|如果|购买|使用|下单|支付|订单|用户|好贸Go|群组偏|频道偏|Telegram\s+群组可以|Telegram\s+频道可以)/,
  );

  if (paragraphStartMatch?.index && paragraphStartMatch.index > 0) {
    const title = text.slice(0, paragraphStartMatch.index).trim();
    const rest = text.slice(paragraphStartMatch.index).trim();

    return rest ? [`${marker} ${title}`, "", rest] : [`${marker} ${title}`];
  }

  return [`${marker} ${text}`];
}

function normalizeMarkdownContent(content: string) {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(#{2,3})\s+/g, "\n\n$1 ")
    .replace(/([^\n])\s+-\s+/g, "$1\n\n- ")
    .replace(/([^\n])\s+(\d+)[\.\、\)]\s+/g, "$1\n\n$2. ");

  return normalized
    .split("\n")
    .flatMap((line) => splitInlineHeading(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderContent(content: string) {
  const elements: JSX.Element[] = [];
  const lines = normalizeMarkdownContent(content).split("\n");
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];

  function flushLists() {
    if (unorderedItems.length > 0) {
      const items = unorderedItems;
      unorderedItems = [];
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc space-y-2 pl-6 text-sm leading-7 text-slate-600"
        >
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              {renderInlineMarkdown(item, `ul-${elements.length}-${index}`)}
            </li>
          ))}
        </ul>,
      );
    }

    if (orderedItems.length > 0) {
      const items = orderedItems;
      orderedItems = [];
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal space-y-2 pl-6 text-sm leading-7 text-slate-600"
        >
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              {renderInlineMarkdown(item, `ol-${elements.length}-${index}`)}
            </li>
          ))}
        </ol>,
      );
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushLists();
      elements.push(
        <h3
          key={`h3-${index}`}
          className="pt-2 text-xl font-semibold leading-8 text-primary"
        >
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""), `h3-${index}`)}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushLists();
      elements.push(
        <h2
          key={`h2-${index}`}
          className="pt-4 text-2xl font-semibold leading-9 text-primary"
        >
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""), `h2-${index}`)}
        </h2>,
      );
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      if (orderedItems.length > 0) {
        flushLists();
      }
      unorderedItems.push(trimmed.replace(/^-\s+/, ""));
      return;
    }

    const orderedMatch = trimmed.match(/^\d+[\.\、\)]\s*(.+)$/);
    if (orderedMatch) {
      if (unorderedItems.length > 0) {
        flushLists();
      }
      orderedItems.push(orderedMatch[1]);
      return;
    }

    flushLists();
    elements.push(
      <p key={`p-${index}`} className="text-sm leading-8 text-slate-600">
        {renderInlineMarkdown(trimmed, `p-${index}`)}
      </p>,
    );
  });

  flushLists();
  return elements;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await prisma.article.findFirst({
    where: {
      ...getVisiblePublishedArticleWhere(),
      slug: params.slug,
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
      ...getVisiblePublishedArticleWhere(),
      slug: params.slug,
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
        ...getVisiblePublishedArticleWhere(),
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
  const coverImageUrl = getHttpImageUrl(article.coverImage);

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

          {coverImageUrl ? (
            <div
              className="mt-8 aspect-[16/9] rounded-lg border border-slate-200 bg-cover bg-center shadow-sm"
              style={{ backgroundImage: `url("${coverImageUrl}")` }}
              role="img"
              aria-label={`${article.title} 封面图`}
            />
          ) : (
            <div className="mt-8 flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-white text-center text-sm text-slate-400">
              图片占位：{article.title}
            </div>
          )}

          <div className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {renderContent(article.content)}
          </div>

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
