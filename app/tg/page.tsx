import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ProductStatus, VariantStatus } from "@prisma/client";

import { ProductCard } from "@/components/site/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVisiblePublishedArticleWhere } from "@/lib/article-visibility";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://haomaogo.com").replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  title: "TG账号购买｜Telegram账号｜飞机号资源 - 好贸Go",
  description:
    "好贸Go提供TG账号、Telegram账号、飞机号、纸飞机号、电报号等账号资源，适合跨境沟通、社群运营、频道管理和工具测试等场景，支持零售购买、订单查询和售后咨询。",
  alternates: {
    canonical: `${siteUrl}/tg`,
  },
};

const telegramKeywords = ["telegram", "tg", "电报", "飞机号", "纸飞机"];

const scenarios = [
  "跨境沟通",
  "社群运营",
  "频道管理",
  "工具测试",
  "多账号备用",
];

const steps = [
  "选择 TG / Telegram 商品",
  "选择规格和数量",
  "填写联系方式",
  "完成支付",
  "订单查询查看发货内容或联系客服",
];

const faqs = [
  {
    question: "TG号和 Telegram 账号是一样的吗？",
    answer:
      "通常可以理解为同类账号资源。TG 是 Telegram 的常见简称，TG号、Telegram账号、飞机号、电报号都是用户对 Telegram 账号的不同叫法。",
  },
  {
    question: "购买后在哪里查看发货内容？",
    answer:
      "订单完成发货后，可以进入订单查询页面，使用订单号或下单联系方式查询订单状态和发货内容。",
  },
  {
    question: "TG账号是否支持 2FA？",
    answer:
      "不同商品规格可能包含不同账号资料。是否包含 TG账号2FA、邮箱、辅助信息等，请以商品详情页和后台填写的商品说明为准。",
  },
  {
    question: "付款后多久可以查看订单？",
    answer:
      "支付成功后系统会更新付款状态，发货完成后即可在订单查询页查看发货内容。如状态暂未更新，可以稍后刷新或联系客服。",
  },
  {
    question: "购买后遇到登录问题怎么办？",
    answer:
      "请保留订单号和下单联系方式，通过售后客服页面联系处理，方便客服核对订单和发货记录。",
  },
  {
    question: "飞机号和TG号有什么区别？",
    answer:
      "飞机号是 Telegram 账号的通俗叫法，TG号则来自 Telegram 的简称。两者在购买场景中通常指同类账号资源，实际差异主要看商品规格、账号资料和是否包含 2FA 等信息。",
  },
  {
    question: "Telegram账号购买前需要注意什么？",
    answer:
      "购买前建议先查看商品规格、库存、发货格式和售后规则，确认是否需要邮箱、2FA 或其他辅助资料。下单后请保存订单号，后续可通过订单查询查看状态或联系售后。",
  },
];

function matchesTelegramKeywords(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const target = value.toLowerCase();
  return telegramKeywords.some((keyword) => target.includes(keyword.toLowerCase()));
}

function isTelegramCategory(category: { name: string; slug: string }) {
  return matchesTelegramKeywords(`${category.name} ${category.slug}`);
}

function getArticleExcerpt(article: {
  summary: string | null;
  seoDescription: string | null;
  content: string;
}) {
  return (
    article.summary ||
    article.seoDescription ||
    article.content.replace(/\s+/g, " ").slice(0, 90)
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "待发布";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function TgTopicPage() {
  const [products, articles] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.active,
        category: {
          isActive: true,
        },
      },
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
    }),
    prisma.article.findMany({
      where: getVisiblePublishedArticleWhere(),
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);
  const telegramProducts = products.filter((product) =>
    isTelegramCategory(product.category),
  );
  const relatedArticles = articles
    .filter((article) => {
      const categoryText = `${article.category.name} ${article.category.slug}`;
      const articleText = `${article.title} ${article.slug} ${article.summary ?? ""}`;

      return (
        matchesTelegramKeywords(categoryText) || matchesTelegramKeywords(articleText)
      );
    })
    .slice(0, 6);

  return (
    <main className="bg-[#F8FAFC] text-[#0F172A]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(37,99,235,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge className="bg-[#ECFDF5] px-4 py-1.5 text-sm text-[#047857] hover:bg-[#ECFDF5]">
            TG号 / Telegram账号 / 飞机号 / 电报号
          </Badge>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-normal text-[#0F172A] sm:text-5xl">
            TG账号购买
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#64748B] sm:text-lg">
            好贸Go提供 TG账号、Telegram账号、飞机号、纸飞机号、电报号等账号资源，适合跨境沟通、社群运营、频道管理和工具测试等场景。支持零售购买、按规格选择、订单查询和售后协助。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="bg-[#14B8A6] text-white hover:bg-[#0F9F93]" asChild>
              <Link href="#tg-products">
                查看 TG 商品
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-[#1E3A8A] bg-white text-[#1E3A8A] hover:bg-[#EFF6FF]"
              asChild
            >
              <Link href="/order/query">
                <Search className="h-4 w-4" aria-hidden="true" />
                查询订单
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="tg-products" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2563EB]">TG账号商品</p>
            <h2 className="mt-2 text-3xl font-bold">
              TG账号 / Telegram账号购买列表
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              以下为已上架的 TG账号、Telegram账号、飞机号相关商品，点击商品可进入详情页查看规格、价格、发货说明和售后规则。
            </p>
          </div>
          <Button variant="outline" className="border-[#E2E8F0]" asChild>
            <Link href="/products">查看全部商品</Link>
          </Button>
        </div>

        {telegramProducts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {telegramProducts.map((product) => {
              const prices = product.variants.map((variant) =>
                Number(variant.price),
              );

              return (
                <ProductCard
                  key={product.id}
                  product={{
                    slug: product.slug,
                    title: product.title,
                    category: product.category.name,
                    coverImage: product.coverImage,
                    description:
                      product.summary ||
                      "查看 TG账号、Telegram账号和飞机号相关商品规格与库存。",
                    price: prices.length > 0 ? Math.min(...prices) : 0,
                    stock: product.inventoryItems.length,
                    tags: ["TG账号", "Telegram", "飞机号"],
                  }}
                />
              );
            })}
          </div>
        ) : (
          <Card className="border-[#E2E8F0] bg-white text-center shadow-sm">
            <CardContent className="py-10 text-sm leading-7 text-[#64748B]">
              暂无已上架的 TG / Telegram 商品。你可以先进入全部商品查看其他账号资源，
              或联系售后客服确认补货时间。
            </CardContent>
          </Card>
        )}
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#14B8A6]" />
                TG账号适合哪些场景
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario}
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#1E3A8A]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#14B8A6]" />
                    {scenario}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-[#2563EB]" />
                TG账号购买流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-[#475569]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold text-[#2563EB]">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle>TG号和 Telegram 账号的区别</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-8 text-[#64748B]">
              TG 是 Telegram 的常见简称。TG号、Telegram账号、飞机号、电报号通常是用户对同类账号资源的不同叫法，
              在购买时应重点查看商品规格、发货格式、是否包含 2FA 或邮箱辅助资料等信息。
            </CardContent>
          </Card>
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle>飞机号是什么意思</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-8 text-[#64748B]">
              飞机号、纸飞机号是用户对 Telegram 账号的通俗叫法，因为 Telegram 图标类似纸飞机。
              在搜索和购买场景里，飞机号通常指 Telegram 账号资源。
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-[#F1F5F9]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-[#2563EB]">常见问题</p>
            <h2 className="mt-2 text-3xl font-bold">TG账号购买 FAQ</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border-[#E2E8F0] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2 text-base">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-[#64748B]">
                  {faq.answer}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 border-[#BFDBFE] bg-[#EFF6FF] shadow-sm">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1E3A8A]">
                  <ShieldCheck className="h-5 w-5" />
                  售后说明
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#475569]">
                  购买 TG账号、Telegram账号或飞机号后，请保留订单号和联系方式。
                  如遇登录、2FA 或发货内容核对问题，可通过售后客服页面联系处理。
                </p>
              </div>
              <Button className="bg-[#14B8A6] text-white hover:bg-[#0F9F93]" asChild>
                <Link href="/contact">联系售后客服</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2563EB]">账号教程</p>
              <h2 className="mt-2 text-3xl font-bold">TG账号相关教程</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
                查看 Telegram账号使用、TG号登录、订单查询和售后处理等相关说明，购买前后都更清楚。
              </p>
            </div>
            <Button variant="outline" className="border-[#E2E8F0]" asChild>
              <Link href="/blog">查看全部教程</Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${encodeURIComponent(article.slug)}`}
                className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-xl"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 font-medium text-[#2563EB]">
                    {article.category.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(article.publishedAt ?? article.createdAt)}
                  </span>
                </div>
                <h3 className="mt-4 line-clamp-2 text-lg font-semibold leading-7 text-[#0F172A]">
                  {article.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#64748B]">
                  {getArticleExcerpt(article)}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#14B8A6]">
                  阅读全文
                  <BookOpen className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
