import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: {
    category?: string;
  };
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const selectedCategory = searchParams?.category;
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const products = await prisma.product.findMany({
    where: {
      status: "active",
      ...(selectedCategory
        ? {
            category: {
              slug: selectedCategory,
            },
          }
        : {}),
    },
    include: {
      category: true,
      variants: {
        where: { status: "active" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      inventoryItems: {
        where: { status: "available" },
        select: { id: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">产品中心</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">虚拟商品列表</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          当前商品从数据库读取。支持 Stripe Checkout 在线支付，支付成功后系统通过 webhook 自动确认付款状态，发货仍由后台管理员人工确认。
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          variant={!selectedCategory ? "deal" : "outline"}
          size="sm"
          asChild
        >
          <Link href="/products">全部</Link>
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? "deal" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/products?category=${category.slug}`}>{category.name}</Link>
          </Button>
        ))}
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-primary">暂无可售商品</p>
            <p className="mt-2 text-sm text-slate-500">
              请先运行数据库 migration 和 seed，或稍后再查看商品列表。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const activePrices = product.variants.map((variant) =>
              Number(variant.price),
            );
            const minPrice =
              activePrices.length > 0 ? Math.min(...activePrices) : 0;
            const availableStock = product.inventoryItems.length;

            return (
              <Card key={product.id} className="flex h-full flex-col overflow-hidden">
                <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-sm text-slate-400">
                  {product.category.name} 商品图占位
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="leading-6">{product.title}</CardTitle>
                    <Badge variant="deal">{product.category.name}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    {product.summary || "暂无商品摘要"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">数据库商品</Badge>
                    <Badge variant="success">active</Badge>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">价格起</p>
                      <p className="text-2xl font-semibold text-primary">
                        {formatCurrency(minPrice)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">库存 {availableStock}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="deal" className="w-full" asChild>
                    <Link href={`/products/${product.slug}`}>立即购买</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
