import Link from "next/link";
import { ArticleStatus, ProductStatus, VariantStatus } from "@prisma/client";
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PackageCheck,
  Send,
} from "lucide-react";

import { ArticleCard } from "@/components/site/ArticleCard";
import { ProductCard } from "@/components/site/ProductCard";
import { StepCard } from "@/components/site/StepCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) {
    return "未发布";
  }

  return date.toLocaleDateString("zh-CN");
}

export default async function HomePage() {
  const [products, articles, settings] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.active },
      include: {
        category: true,
        variants: {
          where: { status: VariantStatus.active },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        inventoryItems: {
          where: { status: "available" },
          select: { id: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.published },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    getSiteSettings(),
  ]);
  const steps = [
    {
      step: "Step 01",
      title: settings.purchase_step_1_title,
      description: settings.purchase_step_1_description,
      icon: ClipboardList,
    },
    {
      step: "Step 02",
      title: settings.purchase_step_2_title,
      description: settings.purchase_step_2_description,
      icon: Send,
    },
    {
      step: "Step 03",
      title: settings.purchase_step_3_title,
      description: settings.purchase_step_3_description,
      icon: CreditCard,
    },
    {
      step: "Step 04",
      title: settings.purchase_step_4_title,
      description: settings.purchase_step_4_description,
      icon: PackageCheck,
    },
  ];
  const features = [
    settings.home_feature_1,
    settings.home_feature_2,
    settings.home_feature_3,
    settings.home_feature_4,
  ].filter(Boolean);

  return (
    <div>
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="deal" className="mb-5">
              {settings.home_hero_badge}
            </Badge>
            <h1 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-5xl">
              {settings.home_hero_title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {settings.home_hero_description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="deal" size="lg" asChild>
                <Link href="/products">{settings.home_primary_button_text}</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/order/query">
                  {settings.home_secondary_button_text}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">联系客服</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5">
            <div className="grid gap-3">
              {features.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md bg-white/10 p-3"
                >
                  <CheckCircle2
                    className="h-5 w-5 text-deal"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accentblue">购买流程</p>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              4 步完成购买流程
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StepCard key={step.step} {...step} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accentblue">推荐商品</p>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              热门虚拟商品
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">全部商品</Link>
          </Button>
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {settings.product_empty_text}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const prices = product.variants.map((variant) =>
                Number(variant.price),
              );

              return (
                <ProductCard
                  key={product.id}
                  buyButtonText={settings.product_card_buy_button_text}
                  product={{
                    slug: product.slug,
                    title: product.title,
                    category: product.category.name,
                    coverImage: product.coverImage,
                    description: product.summary || "查看商品详情和可用规格。",
                    price: prices.length > 0 ? Math.min(...prices) : 0,
                    stock: product.inventoryItems.length,
                    tags: ["数据库商品", "文本发货"],
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accentblue">SEO 内容</p>
            <h2 className="mt-2 text-2xl font-bold text-primary">最新文章</h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/blog">文章列表</Link>
          </Button>
        </div>
        {articles.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            暂无已发布文章。
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
                  excerpt: article.summary || "查看文章详情。",
                  keyword: article.seoKeywords,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
