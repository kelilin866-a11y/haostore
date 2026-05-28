import Link from "next/link";
import { CheckCircle2, ClipboardList, CreditCard, PackageCheck, Send } from "lucide-react";

import { ArticleCard } from "@/components/site/ArticleCard";
import { ProductCard } from "@/components/site/ProductCard";
import { StepCard } from "@/components/site/StepCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { articles, products } from "@/lib/mock-data";

const steps = [
  {
    step: "Step 01",
    title: "选择商品",
    description: "浏览账号类、卡密类和教程类文本商品，查看价格、库存和发货格式。",
    icon: ClipboardList,
  },
  {
    step: "Step 02",
    title: "填写联系方式",
    description: "无需注册、无需购物车，商品详情页直接下单并留下联系方式。",
    icon: Send,
  },
  {
    step: "Step 03",
    title: "确认支付",
    description: "支持 Stripe Checkout 在线支付，支付成功后系统通过 Stripe webhook 自动确认付款状态。",
    icon: CreditCard,
  },
  {
    step: "Step 04",
    title: "确认发货",
    description: "发货仍由后台管理员人工确认，支付成功前不会展示任何发货内容。",
    icon: PackageCheck,
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="deal" className="mb-5">
              第一阶段基础项目
            </Badge>
            <h1 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-5xl">
              虚拟商品自动发货商城
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              面向账号类、卡密类和教程类文本商品的无登录、无购物车商城。当前支持 Stripe Checkout 在线支付，支付成功后由 webhook 确认付款状态，后台管理员再人工确认发货。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="deal" size="lg" asChild>
                <Link href="/products">进入产品中心</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/order/query">查询订单</Link>
              </Button>
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10" asChild>
                <Link href="/contact">联系客服</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5">
            <div className="grid gap-3">
              {["Stripe Checkout 在线支付", "后台人工确认发货", "订单号 + 联系方式查询", "SEO文章系统预留"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-white/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-deal" aria-hidden="true" />
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
            <h2 className="mt-2 text-2xl font-bold text-primary">4 步完成演示下单</h2>
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
            <h2 className="mt-2 text-2xl font-bold text-primary">热门虚拟商品</h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">全部商品</Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
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
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
