import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BulkInventoryImportForm } from "@/components/site/BulkInventoryImportForm";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getProductStatusLabel(status: string) {
  return status === "active" ? "已上架" : "未上架";
}

function getVariantStatusLabel(status: string) {
  return status === "active" ? "启用" : "停用";
}

export default async function AdminInventoryPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/inventory");
  }

  const [products, logs] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        variants: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            inventoryItems: {
              where: { status: "available" },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              select: { content: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.inventoryLog.findMany({
      include: {
        product: { select: { title: true } },
        variant: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const bulkImportProducts = products.map((product) => ({
    id: product.id,
    title: product.title,
    categoryName: product.category.name,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      status: variant.status,
    })),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">库存管理</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          按规格维护 available 文本库存。每行代表一条可发货内容，保存后会写入库存变动记录；已售出库存不会被修改。
        </p>
      </div>

      {bulkImportProducts.length > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>批量导入库存</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkInventoryImportForm products={bulkImportProducts} />
          </CardContent>
        </Card>
      ) : null}

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无商品，请先在商品管理中创建商品和规格。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {products.map((product) => {
            const totalStock = product.variants.reduce(
              (sum, variant) => sum + variant.inventoryItems.length,
              0,
            );

            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle>{product.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-500">
                        分类：{product.category.name} / 当前库存：{totalStock}
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
                      <Badge variant="deal">库存 {totalStock}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {product.variants.length === 0 ? (
                    <p className="text-sm text-slate-500">暂无规格。</p>
                  ) : (
                    product.variants.map((variant) => {
                      const currentStock = variant.inventoryItems.length;
                      const inventoryText = variant.inventoryItems
                        .map((item) => item.content)
                        .join("\n");

                      return (
                        <form
                          key={variant.id}
                          action="/api/admin/inventory"
                          method="post"
                          className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4"
                        >
                          <input
                            type="hidden"
                            name="variantId"
                            value={variant.id}
                          />
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-primary">
                                {variant.name}
                              </p>
                              <p className="mt-1 font-mono text-xs text-slate-500">
                                {variant.sku}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {getVariantStatusLabel(variant.status)}
                              </Badge>
                              <Badge
                                variant={currentStock > 0 ? "success" : "outline"}
                              >
                                当前库存 {currentStock}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`inventoryText_${variant.id}`}>
                              库存文本（每行一条）
                            </Label>
                            <textarea
                              id={`inventoryText_${variant.id}`}
                              name="inventoryText"
                              defaultValue={inventoryText}
                              rows={Math.max(4, Math.min(10, currentStock + 2))}
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                              placeholder="账号----密码----邮箱----邮箱密码"
                            />
                          </div>

                          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                            <div className="space-y-2">
                              <Label htmlFor={`note_${variant.id}`}>备注</Label>
                              <input
                                id={`note_${variant.id}`}
                                name="note"
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                                placeholder="例如：补充库存、清理无效库存"
                              />
                            </div>
                            <Button type="submit" variant="deal">
                              保存库存
                            </Button>
                          </div>
                        </form>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>最近库存变动</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">暂无库存变动记录。</p>
          ) : (
            <div className="grid gap-3 text-sm">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_110px_120px_160px]"
                >
                  <div>
                    <p className="font-medium text-primary">
                      {log.product.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.variant
                        ? `${log.variant.name} / ${log.variant.sku}`
                        : "商品级库存"}
                    </p>
                    {log.note ? (
                      <p className="mt-1 text-xs text-slate-500">
                        备注：{log.note}
                      </p>
                    ) : null}
                  </div>
                  <span>{log.operationType}</span>
                  <span>
                    {log.beforeStock} → {log.afterStock}（
                    {log.quantityChange >= 0 ? "+" : ""}
                    {log.quantityChange}）
                  </span>
                  <span className="text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
