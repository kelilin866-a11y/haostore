import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Package } from "lucide-react";

import { OrderForm } from "@/components/site/OrderForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findFirst({
    where: {
      slug: params.slug,
      status: "active",
    },
    include: {
      category: true,
      variants: {
        where: { status: "active" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      inventoryItems: {
        where: { status: "available" },
        select: { id: true, variantId: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: Number(variant.price),
    availableStock: product.inventoryItems.filter(
      (item) => item.variantId === variant.id,
    ).length,
  }));
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((variant) => variant.price))
      : 0;
  const totalStock = variants.reduce(
    (sum, variant) => sum + variant.availableStock,
    0,
  );
  const noticeItems = product.notice
    ? product.notice.split(/\r?\n/).filter(Boolean)
    : ["请在购买前确认用途合规。", "付款后请联系客服提供订单号。"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
            {product.title} 主图占位
          </div>
          <div className="mt-8 grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accentblue" aria-hidden="true" />
                  商品说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
                <p>{product.description || product.summary || "暂无商品说明。"}</p>
                <p>
                  本阶段下单后会创建待人工确认付款订单，并跳转到人工支付说明页，不会接入真实支付，也不会自动发货。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                  注意事项
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm text-slate-600">
                  {noticeItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-deal" aria-hidden="true" />
                  发货与售后说明
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-primary">发货格式</p>
                  <p className="mt-2 rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700">
                    {product.deliveryFormat || "账号----密码----备注"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-primary">售后说明</p>
                  <p className="mt-2 leading-6">
                    {product.afterSales || "如有问题，请提供订单号联系客服核验。"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="deal">{product.category.name}</Badge>
                <Badge variant="outline">发货类型：文本</Badge>
              </div>
              <CardTitle className="text-2xl leading-8">{product.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">价格起</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(minPrice)}
                  </p>
                </div>
                <p className="text-sm text-slate-500">库存 {totalStock}</p>
              </div>

              <Separator />

              <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-xs text-slate-600">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="font-medium text-primary">{variant.name}</span>
                    <span>{formatCurrency(variant.price)}</span>
                    <span>库存 {variant.availableStock}</span>
                    <span className="font-mono">{variant.sku}</span>
                  </div>
                ))}
              </div>

              <OrderForm productId={product.id} variants={variants} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
