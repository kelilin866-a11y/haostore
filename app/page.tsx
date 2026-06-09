import Link from "next/link";
import { ArticleStatus, ProductStatus, VariantStatus } from "@prisma/client";
import {
  Apple,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Headphones,
  Mail,
  MessageCircle,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";

import { ProductCard } from "@/components/site/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const heroConfig = {
  title: "购买属于你的高质量产品",
  description:
    "精选账号类、卡密类和教程资料，支持在线下单，支付后由后台确认发货，购买流程清晰可查。",
  categories: [
    { label: "Instagram", href: "/products?category=instagram" },
    { label: "Facebook", href: "/products?category=facebook" },
    { label: "Twitter", href: "/products?category=twitter-x" },
    { label: "Discord", href: "/products?category=discord" },
    { label: "Telegram", href: "/products?category=telegram" },
    { label: "TikTok", href: "/products?category=tiktok" },
    { label: "Google系列", href: "/products?category=google" },
    { label: "Apple ID", href: "/products?category=apple-id" },
    { label: "AI账号(ChatGPT...)", href: "/products?category=ai-account" },
    { label: "Snapchat", href: "/products?category=snapchat" },
    { label: "Amazon", href: "/products?category=amazon" },
    { label: "Github", href: "/products?category=github" },
    { label: "邮箱账户", href: "/products?category=email-account" },
  ],
  primaryButton: { label: "查看商品", href: "/products" },
  secondaryButton: { label: "查询订单", href: "/order/query" },
};

const categoryMeta = [
  {
    hints: ["telegram", "tg", "电报"],
    icon: Send,
    description: "电报账号、老号、频道运营资源",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    hints: ["discord", "dc"],
    icon: MessageCircle,
    description: "Discord 账号、社群和工具相关资源",
    tint: "bg-indigo-50 text-indigo-600",
  },
  {
    hints: ["twitter", "x", "推特"],
    icon: MessageCircle,
    description: "社媒账号、邮箱验证号和运营资料",
    tint: "bg-blue-50 text-blue-600",
  },
  {
    hints: ["instagram", "ins", "ig"],
    icon: Camera,
    description: "图文平台账号、资料和使用工具",
    tint: "bg-rose-50 text-rose-600",
  },
  {
    hints: ["apple", "id", "苹果"],
    icon: Apple,
    description: "Apple ID、账号资料和相关教程",
    tint: "bg-slate-100 text-slate-700",
  },
  {
    hints: ["tiktok", "tok", "抖音"],
    icon: Camera,
    description: "短视频平台账号与工具资料",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    hints: ["教程", "资料", "tool", "tutorial", "course"],
    icon: BookOpen,
    description: "登录教程、安全使用和工具教程包",
    tint: "bg-emerald-50 text-emerald-600",
  },
];

const fallbackCategoryMeta = {
  icon: Store,
  description: "精选虚拟商品分类，进入查看可售商品",
  tint: "bg-blue-50 text-blue-600",
};

const flowSteps = [
  {
    step: "Step 01",
    title: "选择商品",
    description: "从分类或热门商品进入详情，查看价格、库存和发货格式。",
    icon: ShoppingBag,
  },
  {
    step: "Step 02",
    title: "提交订单",
    description: "选择规格和数量，填写联系方式，无需注册和购物车。",
    icon: CheckCircle2,
  },
  {
    step: "Step 03",
    title: "在线支付",
    description: "使用 Stripe Checkout 在线支付，系统通过 webhook 确认付款。",
    icon: CreditCard,
  },
  {
    step: "Step 04",
    title: "确认发货",
    description: "后台确认发货后，用户可通过订单查询查看发货内容。",
    icon: PackageCheck,
  },
];

const faqItems = [
  {
    question: "下单需要注册账号吗？",
    answer: "不需要。选择商品规格后填写联系方式即可提交订单。",
  },
  {
    question: "支付成功后会立即显示发货内容吗？",
    answer: "不会。系统确认付款状态后，仍由后台管理员人工确认发货。",
  },
  {
    question: "如何查看订单和发货内容？",
    answer: "通过订单查询页输入订单号或下单联系方式，即可查看订单状态。",
  },
];

function getCategoryHref(slug: string | null | undefined) {
  return slug ? `/products?category=${encodeURIComponent(slug)}` : "/products";
}

function getCategoryMeta(category: { name: string; slug: string }) {
  const target = `${category.name} ${category.slug}`.toLowerCase();

  return (
    categoryMeta.find((item) =>
      item.hints.some((hint) => target.includes(hint.toLowerCase())),
    ) ?? fallbackCategoryMeta
  );
}

function getArticleExcerpt(article: {
  summary: string | null;
  seoDescription: string | null;
  content: string;
}) {
  return (
    article.summary ||
    article.seoDescription ||
    article.content.replace(/\s+/g, " ").slice(0, 80)
  );
}

function formatArticleDate(date: Date | null) {
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

export default async function HomePage() {
  const [settings, categories, products, articles] = await Promise.all([
    getSiteSettings(),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: ProductStatus.active },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
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
      take: 6,
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.published },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  return (
    <main className="overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <section className="relative px-4 py-16 sm:px-6 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(37,99,235,0.12),transparent_30%),radial-gradient(circle_at_80%_24%,rgba(20,184,166,0.12),transparent_28%)]" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-normal text-[#0F172A] sm:text-5xl lg:text-6xl">
            {heroConfig.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#64748B] sm:text-lg">
            {heroConfig.description}
          </p>

          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {heroConfig.categories.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm transition hover:border-[#14B8A6] hover:text-[#0F9F93]"
              >
                {category.label}
              </Link>
            ))}
          </div>

          <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="bg-[#14B8A6] px-8 text-white shadow-lg shadow-teal-100 hover:bg-[#0F9F93]"
              asChild
            >
              <Link href={heroConfig.primaryButton.href}>
                {heroConfig.primaryButton.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#1E3A8A] bg-white px-8 text-[#1E3A8A] hover:bg-[#EFF6FF]"
              asChild
            >
              <Link href={heroConfig.secondaryButton.href}>
                {heroConfig.secondaryButton.label}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="purchase-flow" className="bg-[#F1F5F9]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-[#2563EB]">购买流程</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">
              四步完成购买和发货查询
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              从选品到查询都有清晰路径，支付成功前不会展示任何发货内容。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.step}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#2563EB]">
                      {step.step}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2563EB]">商品分类</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">
              按平台和用途快速选品
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              分类来自后台配置，客户可以先按平台进入，再挑选具体商品规格。
            </p>
          </div>
          <Button variant="outline" className="border-[#E2E8F0]" asChild>
            <Link href="/products">全部商品</Link>
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
            暂无商品分类，请先在后台创建分类。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const meta = getCategoryMeta(category);
              const Icon = meta.icon;

              return (
                <Link
                  key={category.id}
                  href={getCategoryHref(category.slug)}
                  className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.tint}`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <Badge className="bg-[#ECFDF5] text-emerald-700 hover:bg-[#ECFDF5]">
                      {category._count.products} 个商品
                    </Badge>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#0F172A]">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    {category.description || meta.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB]">
                    进入分类
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section id="hot-products" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2563EB]">
                热门商品 / 已上架商品
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">
                热门虚拟商品
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                精选当前可购买商品，库存和价格以页面展示为准。
              </p>
            </div>
            <Button variant="outline" className="border-[#E2E8F0]" asChild>
              <Link href="/products">进入商品中心</Link>
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
              暂无上架商品，请先在后台商品管理中创建商品。
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const prices = product.variants.map((variant) =>
                  Number(variant.price),
                );

                return (
                  <ProductCard
                    key={product.id}
                    buyButtonText={
                      settings.product_card_buy_button_text || "立即购买"
                    }
                    product={{
                      slug: product.slug,
                      title: product.title,
                      category: product.category.name,
                      coverImage: product.coverImage,
                      description: product.summary || "查看商品详情和可用规格。",
                      price: prices.length > 0 ? Math.min(...prices) : 0,
                      stock: product.inventoryItems.length,
                      tags: ["现货", "文本发货"],
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2563EB]">最近文章</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">
              最新教程与购买指南
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              查看账号使用、下单说明和售后规则，购买前更清楚。
            </p>
          </div>
          <Button variant="outline" className="border-[#E2E8F0]" asChild>
            <Link href="/blog">查看全部文章</Link>
          </Button>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
            暂无文章，后续会更新购买教程和使用说明。
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${encodeURIComponent(article.slug)}`}
                className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-xl"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 font-medium text-[#2563EB]">
                    {article.category.name}
                  </span>
                  <span>{formatArticleDate(article.publishedAt)}</span>
                </div>
                <h3 className="mt-4 line-clamp-2 text-lg font-semibold leading-7 text-[#0F172A]">
                  {article.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#64748B]">
                  {getArticleExcerpt(article)}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#14B8A6]">
                  阅读全文
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#F1F5F9]">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-[#2563EB]">FAQ / 售后说明</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">
              下单前后的关键信息
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#64748B]">
              售后沟通请提供订单号和联系方式，便于核验支付状态与发货记录。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="bg-[#14B8A6] text-white hover:bg-[#0F9F93]" asChild>
                <Link href="/order/query">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  查询订单
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-[#1E3A8A] bg-white text-[#1E3A8A] hover:bg-[#EFF6FF]"
                asChild
              >
                <Link href="/contact">
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                  联系客服
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#0F172A]">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748B]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/contact"
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Mail className="h-6 w-6 text-[#14B8A6]" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-[#0F172A]">售后客服</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  遇到发货内容或订单状态问题，可通过客服入口提交订单号。
                </p>
              </Link>
              <Link
                href="/policy/after-sales"
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ShieldCheck
                  className="h-6 w-6 text-[#2563EB]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-semibold text-[#0F172A]">售后政策</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  查看发货核验、售后条件和联系方式要求。
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
