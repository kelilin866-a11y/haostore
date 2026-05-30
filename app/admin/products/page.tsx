import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getProductStatusLabel(status: string) {
  return status === "active" ? "已上架" : "已下架";
}

function getVariantStatusLabel(status: string) {
  return status === "active" ? "启用" : "停用";
}

export default async function AdminProductsPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/products");
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          inventoryItems: {
            where: { status: "available" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accentblue">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">商品管理</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            管理前台可售商品、上下架状态、规格价格和文本库存。库存文本每行一条，
            前台可用库存按 available 库存实时统计。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="deal" asChild>
            <Link href="/admin/products/new">新增商品</Link>
          </Button>
          <AdminLogoutButton />
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无商品，请先新增商品。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {products.map((product) => {
            const availableStock = product.variants.reduce(
              (sum, variant) => sum + variant.inventoryItems.length,
              0,
            );

            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>{product.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-500">
                        /products/{product.slug} / {product.category.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          product.status === "active" ? "success" : "outline"
                        }
                      >
                        {getProductStatusLabel(product.status)}
                      </Badge>
                      <Badge variant="deal">库存 {availableStock}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm leading-6 text-slate-500">
                    {product.summary || "暂无商品简介"}
                  </p>

                  <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
                    {product.variants.length === 0 ? (
                      <p className="text-slate-500">暂无规格</p>
                    ) : (
                      product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="grid gap-2 md:grid-cols-[1fr_140px_120px_100px_80px]"
                        >
                          <span className="font-medium text-primary">
                            {variant.name}
                          </span>
                          <span className="font-mono text-xs">{variant.sku}</span>
                          <span>{formatCurrency(Number(variant.price))}</span>
                          <span>库存 {variant.inventoryItems.length}</span>
                          <span>{getVariantStatusLabel(variant.status)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          编辑商品
                        </Link>
                      </Button>
                      <form
                        action={`/api/admin/products/${product.id}/status`}
                        method="post"
                      >
                        <input
                          type="hidden"
                          name="status"
                          value={
                            product.status === "active" ? "inactive" : "active"
                          }
                        />
                        <Button variant="outline" size="sm" type="submit">
                          {product.status === "active" ? "下架" : "上架"}
                        </Button>
                      </form>
                    </div>
                    <p className="text-xs text-slate-500">
                      更新时间：{product.updatedAt.toLocaleString("zh-CN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
