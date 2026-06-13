import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
} from "lucide-react";

import { OrderForm } from "@/components/site/OrderForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { getStorefrontPaymentMethods } from "@/lib/payments/methods";
import { isNezhaPaymentEnabled } from "@/lib/payments/nezha";
import { paymentGatewayConfig } from "@/lib/payment-gateway";
import { getSiteSettings } from "@/lib/site-settings";
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
  const [product, settings] = await Promise.all([
    prisma.product.findFirst({
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
    }),
    getSiteSettings(),
  ]);

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
    : settings.product_default_notice.split(/\r?\n/).filter(Boolean);
  const deliveryText = product.deliveryFormat || settings.product_default_delivery;
  const afterSalesText = product.afterSales || settings.after_sales_notice;
  const coverImageUrl = getHttpImageUrl(product.coverImage);
  const paymentMethods = getStorefrontPaymentMethods({
    isNezhaEnabled: isNezhaPaymentEnabled(),
    stripeLabel: paymentGatewayConfig.gatewayName,
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

          <div className="mt-8 grid gap-5">
            {product.summary ? (
              <Card className="border-[#E2E8F0] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                    <Info className="h-5 w-5 text-[#14B8A6]" aria-hidden="true" />
                    商品简介
                  </CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-line text-sm leading-7 text-[#475569]">
                  {product.summary}
                </CardContent>
              </Card>
            ) : null}

            {product.description ? (
              <Card className="border-[#E2E8F0] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                    <FileText
                      className="h-5 w-5 text-[#2563EB]"
                      aria-hidden="true"
                    />
                    商品说明
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 whitespace-pre-line text-sm leading-8 text-[#475569]">
                  {product.description}
                  <p className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[#64748B]">
                    {settings.product_detail_payment_notice}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {noticeItems.length > 0 ? (
              <Card className="border-[#FDE68A] bg-[#FFFBEB] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#92400E]">
                  <AlertTriangle
                    className="h-5 w-5 text-[#F59E0B]"
                    aria-hidden="true"
                  />
                  {settings.product_detail_notice_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm leading-6 text-[#78350F]">
                  {noticeItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            ) : null}

            {deliveryText || afterSalesText ? (
              <Card className="border-[#BFDBFE] bg-[#EFF6FF] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1E3A8A]">
                  <ShieldCheck
                    className="h-5 w-5 text-[#2563EB]"
                    aria-hidden="true"
                  />
                  发货与售后说明
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-[#475569]">
                {deliveryText ? (
                  <div>
                  <p className="font-semibold text-[#1E3A8A]">
                    {settings.product_detail_delivery_title}
                  </p>
                  <p className="mt-2 whitespace-pre-line rounded-xl border border-[#BFDBFE] bg-white/70 p-4 leading-7">
                    {deliveryText}
                  </p>
                </div>
                ) : null}
                {afterSalesText ? (
                  <div>
                  <p className="font-semibold text-[#1E3A8A]">
                    {settings.product_detail_after_sales_title}
                  </p>
                  <p className="mt-2 whitespace-pre-line leading-7">
                    {afterSalesText}
                  </p>
                </div>
                ) : null}
              </CardContent>
            </Card>
            ) : null}
          </div>
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
