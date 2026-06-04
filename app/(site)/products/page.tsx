import Link from "next/link";

import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: {
    category?: string;
  };
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const selectedCategory = searchParams?.category;
  const [categories, products, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.product.findMany({
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
    }),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">产品中心</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          {settings.products_page_title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          {settings.products_page_description}
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
            <Link href={`/products?category=${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          </Button>
        ))}
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-primary">暂无可售商品</p>
            <p className="mt-2 text-sm text-slate-500">
              {settings.product_empty_text}
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
                  price: minPrice,
                  stock: product.inventoryItems.length,
                  tags: ["数据库商品", "文本发货"],
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
