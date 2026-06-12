import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Headphones,
} from "lucide-react";

import { PaymentCheckoutButton } from "@/components/site/PaymentCheckoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import {
  isStripePaymentEnabled,
  paymentGatewayConfig,
} from "@/lib/payment-gateway";
import { getSiteSettings } from "@/lib/site-settings";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const paymentMethodLabels: Record<string, string> = {
  manual_alipay: "支付宝备用通道",
  manual_wechat: "微信备用通道",
  manual_usdt: "USDT 备用通道",
  gateway_reserved: paymentGatewayConfig.gatewayName,
  nezha_alipay: "哪吒支付宝",
  nezha_wxpay: "哪吒微信支付",
};

const currentPaymentNotice =
  "支持 Stripe Checkout 在线支付。支付成功后系统通过 Stripe webhook 自动确认付款状态。发货仍由后台管理员人工确认，支付成功前不会展示任何发货内容。若支付状态暂未更新，请稍后刷新或通过订单查询查看。";

async function getSettings() {
  const settings = await getSiteSettings();

  return {
    paymentNotice: settings.payment_notice,
    customerTelegram: settings.customer_service_telegram,
    customerEmail: settings.customer_service_email,
  };
}

export default async function PayPage({
  params,
  searchParams,
}: {
  params: { orderNo: string };
  searchParams?: { payment?: string };
}) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { orderNo: params.orderNo },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        deliveryItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getSettings(),
  ]);

  if (!order) {
    notFound();
  }

  const isDelivered = order.deliveryStatus === "delivered";
  const isOnlinePaymentAvailable = isStripePaymentEnabled();
  const canUseOnlinePayment =
    isOnlinePaymentAvailable && !isDelivered && order.paymentStatus !== "paid";
  const displayedPaymentMethod = canUseOnlinePayment
    ? paymentGatewayConfig.gatewayName
    : paymentMethodLabels[order.paymentMethod] || order.paymentMethod;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">
          {isDelivered ? "发货结果" : "支付说明"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          {isDelivered ? "订单已发货" : "订单待支付确认"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isDelivered
            ? "支付状态已确认并完成发货，请及时保存发货内容。"
            : isOnlinePaymentAvailable
              ? settings.paymentNotice
              : "在线支付配置暂不可用，请稍后刷新或通过订单查询查看支付状态。发货仍由后台管理员人工确认。"}
        </p>
      </div>

      <div className="grid gap-5">
        {searchParams?.payment === "success" && !isDelivered ? (
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-4 text-sm text-teal-800">
              支付页面已返回。若支付状态暂未更新，请稍等支付回调处理后刷新页面，或通过订单查询查看最新状态。
            </CardContent>
          </Card>
        ) : null}

        {searchParams?.payment === "cancelled" ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              你已取消在线支付，可以重新发起 Stripe Checkout。支付成功前不会展示任何发货内容。
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-deal" aria-hidden="true" />
              订单信息
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
              <p>
                订单号：
                <span className="font-medium text-primary">{order.orderNo}</span>
              </p>
              <p>
                总金额：
                <span className="font-medium text-primary">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </p>
              <p>
                支付状态：
                <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                  {order.paymentStatus}
                </Badge>
              </p>
              <p>
                发货状态：
                <Badge variant={isDelivered ? "success" : "outline"}>
                  {order.deliveryStatus}
                </Badge>
              </p>
              <p>
                联系方式：
                <span className="font-medium text-primary">{order.contact}</span>
              </p>
              <p>
                支付方式：
                <span className="font-medium text-primary">
                  {displayedPaymentMethod}
                </span>
              </p>
              <p>创建时间：{formatDateTime(order.createdAt)}</p>
              <p>支付时间：{formatDateTime(order.paidAt)}</p>
              <p>发货时间：{formatDateTime(order.deliveredAt)}</p>
            </div>

            <div>
              <p className="mb-2 font-medium text-primary">商品明细</p>
              <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 text-sm sm:grid-cols-[1fr_120px_80px_120px]"
                  >
                    <span className="font-medium text-primary">
                      {item.productTitleSnapshot}
                    </span>
                    <span>{item.variantNameSnapshot}</span>
                    <span>数量 {item.quantity}</span>
                    <span>{formatCurrency(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isDelivered ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                发货内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700">
                {order.deliveryItems.map((item) => (
                  <p key={item.id} className="break-all">
                    {item.content}
                  </p>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                请及时保存发货内容。售后请提供订单号和下单联系方式。
              </p>
            </CardContent>
          </Card>
        ) : canUseOnlinePayment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-deal" aria-hidden="true" />
                在线支付
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
              <p>
                支付网关：{paymentGatewayConfig.gatewayName}。支付成功后，系统会通过
                webhook 自动确认付款状态。发货仍由后台人工确认，确认前不会展示任何发货内容。
              </p>
              <PaymentCheckoutButton orderNo={order.orderNo} />
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-600">
                未完成后台发货确认前，页面不会展示任何发货内容。
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                支付说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
              <p>{settings.paymentNotice}</p>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
                当前订单不会自动发货，不展示任何发货内容。支付状态确认后，仍需后台管理员人工确认发货。
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-accentblue" aria-hidden="true" />
              客服联系方式
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-600">
            <p>Telegram：{settings.customerTelegram}</p>
            <p>邮箱：{settings.customerEmail}</p>
            <Button variant="outline" className="mt-3 w-fit" asChild>
              <Link href="/contact">联系客服</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
