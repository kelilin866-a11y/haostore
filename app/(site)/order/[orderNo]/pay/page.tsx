import { notFound } from "next/navigation";
import { AlertTriangle, CreditCard, Headphones } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const paymentMethodLabels: Record<string, string> = {
  manual_alipay: "人工支付宝",
  manual_wechat: "人工微信",
  manual_usdt: "人工 USDT",
  gateway_reserved: "支付网关预留",
};

async function getSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["payment_notice", "customer_telegram", "customer_email"],
      },
    },
  });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    paymentNotice:
      map.get("payment_notice") ||
      process.env.MANUAL_PAYMENT_NOTICE ||
      "当前为人工确认支付，付款后请联系客服提供订单号。管理员确认后才会发货。",
    customerTelegram:
      map.get("customer_telegram") ||
      process.env.CUSTOMER_SERVICE_TELEGRAM ||
      siteConfig.customerTelegram,
    customerEmail:
      map.get("customer_email") ||
      process.env.CUSTOMER_SERVICE_EMAIL ||
      siteConfig.customerEmail,
  };
}

export default async function ManualPayPage({
  params,
}: {
  params: { orderNo: string };
}) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { orderNo: params.orderNo },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getSettings(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">人工支付说明</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">订单待人工确认</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          当前为人工确认支付，付款后请联系客服提供订单号。管理员确认后才会发货。
        </p>
      </div>

      <div className="grid gap-5">
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
                支付状态：<Badge variant="warning">{order.paymentStatus}</Badge>
              </p>
              <p>
                发货状态：<Badge variant="outline">{order.deliveryStatus}</Badge>
              </p>
              <p>
                联系方式：
                <span className="font-medium text-primary">{order.contact}</span>
              </p>
              <p>
                支付方式：
                <span className="font-medium text-primary">
                  {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                </span>
              </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              付款说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
            <p>{settings.paymentNotice}</p>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
              当前订单不会自动发货，不展示任何发货内容。请付款后联系客服提供订单号，等待管理员人工确认。
            </div>
          </CardContent>
        </Card>

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
              <a href="/contact">联系客服</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
