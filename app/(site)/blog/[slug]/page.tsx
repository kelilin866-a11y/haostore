import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/site/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { articles, products } from "@/lib/mock-data";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = articles.find((item) => item.slug === params.slug);

  if (!article) {
    return {};
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: article.canonical,
    },
  };
}

export default function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = articles.find((item) => item.slug === params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = articles.filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="deal">{article.category}</Badge>
            <span className="text-sm text-slate-500">发布时间：{article.date}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 grid gap-1 text-sm text-slate-500">
            <p>meta title 预留：{article.metaTitle}</p>
            <p>meta description 预留：{article.metaDescription}</p>
            <p>canonical 预留：{article.canonical}</p>
          </div>

          <div className="mt-8 flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-white text-center text-sm text-slate-400">
            图片占位：{article.imageAlt}
          </div>

          <div className="mt-8 space-y-8">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-primary">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                {section.subheadings?.map((subheading) => (
                  <div key={subheading.heading} className="mt-5">
                    <h3 className="text-lg font-semibold text-primary">{subheading.heading}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{subheading.body}</p>
                  </div>
                ))}
              </section>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {article.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-primary">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </article>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>相关文章</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {relatedArticles.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="text-sm font-medium leading-6 text-primary hover:text-accentblue">
                  {item.title}
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>相关商品推荐</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ProductCard product={products[0]} />
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
