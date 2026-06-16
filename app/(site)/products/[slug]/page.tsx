import { notFound } from "next/navigation";
import { Info } from "lucide-react";

import { OrderForm } from "@/components/site/OrderForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import {
  getDefaultPaymentProviders,
  getStorefrontPaymentMethods,
} from "@/lib/payments/methods";
import { isEpayPaymentEnabled } from "@/lib/payments/epay";
import { isNezhaPaymentEnabled } from "@/lib/payments/nezha";
import {
  isStripePaymentEnabled,
  paymentGatewayConfig,
} from "@/lib/payment-gateway";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getHttpImageUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

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
  const productIntro =
    product.description?.trim() ||
    product.summary?.trim() ||
    "暂无商品介绍，请联系客服确认。";
  const coverImageUrl = getHttpImageUrl(product.coverImage);
  const paymentMethods = getStorefrontPaymentMethods({
    isNezhaEnabled: await isNezhaPaymentEnabled(),
    isEpayEnabled: await isEpayPaymentEnabled(),
    isStripeEnabled: await isStripePaymentEnabled(),
    stripeLabel: paymentGatewayConfig.gatewayName,
    defaultProviders: await getDefaultPaymentProviders(),
  });

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            {coverImageUrl ? (
              <div
                aria-label={`${product.title} 主图`}
                className="aspect-[16/9] rounded-2xl border border-[#E2E8F0] bg-white bg-cover bg-center shadow-sm"
                role="img"
                style={{ backgroundImage: `url("${coverImageUrl}")` }}
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#64748B] shadow-sm">
                {product.coverImage || `${product.title} 主图占位`}
              </div>
            )}

            <Card className="mt-8 border-[#E2E8F0] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <Info className="h-5 w-5 text-[#14B8A6]" aria-hidden="true" />
                  商品简介
                </CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line text-sm leading-8 text-[#475569]">
                {productIntro}
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-[#E2E8F0] bg-white shadow-xl shadow-slate-200/60">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#EFF6FF]">
                    {product.category.name}
                  </Badge>
                  <Badge className="bg-[#ECFDF5] text-emerald-700 hover:bg-[#ECFDF5]">
                    发货类型：文本
                  </Badge>
                </div>
                <CardTitle className="text-2xl leading-8 text-[#0F172A] sm:text-3xl">
                  {product.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-[#64748B]">价格起</p>
                    <p className="text-3xl font-bold text-[#14B8A6]">
                      {formatCurrency(minPrice)}
                    </p>
                  </div>
                  <p className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#047857]">
                    库存 {totalStock}
                  </p>
                </div>

                <Separator className="bg-[#E2E8F0]" />

                <OrderForm
                  productId={product.id}
                  variants={variants}
                  paymentMethods={paymentMethods}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
