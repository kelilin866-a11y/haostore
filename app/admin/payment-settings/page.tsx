import { redirect } from "next/navigation";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getNezhaConfigIssues,
  getNezhaDisplayDiagnostics,
  nezhaPayConfig,
} from "@/lib/payments/nezha";
import {
  isStripePaymentEnabled,
  paymentGatewayConfig,
} from "@/lib/payment-gateway";

export const dynamic = "force-dynamic";

function maskStatus(value: boolean) {
  return value ? "已配置" : "未配置";
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? "success" : "warning"}>
      {enabled ? "已启用" : "未启用"}
    </Badge>
  );
}

function ConfigStatus({ value }: { value: boolean }) {
  return (
    <Badge variant={value ? "success" : "warning"}>
      {maskStatus(value)}
    </Badge>
  );
}

function ValueRow({
  label,
  value,
  isSecret,
}: {
  label: string;
  value: string | boolean;
  isSecret?: boolean;
}) {
  const displayValue =
    typeof value === "boolean" ? (
      <ConfigStatus value={value} />
    ) : isSecret ? (
      <ConfigStatus value={Boolean(value)} />
    ) : (
      <span className="break-all font-medium text-primary">{value || "未配置"}</span>
    );

  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[220px_1fr]">
      <span className="text-slate-500">{label}</span>
      <div>{displayValue}</div>
    </div>
  );
}

export default function AdminPaymentSettingsPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/payment-settings");
  }

  const nezhaDiagnostics = getNezhaDisplayDiagnostics();
  const nezhaIssues = getNezhaConfigIssues();
  const isNezhaReady = nezhaIssues.length === 0;
  const isStripeReady = isStripePaymentEnabled();
  const defaultAlipayProvider = process.env.DEFAULT_ALIPAY_PROVIDER || "nezha";
  const defaultWxpayProvider = process.env.DEFAULT_WXPAY_PROVIDER || "nezha";
  const nezhaWebhookUrl = new URL(
    "/api/payments/nezha/webhook",
    paymentGatewayConfig.siteUrl,
  ).toString();
  const nezhaReturnUrl = new URL(
    "/payment/result",
    paymentGatewayConfig.siteUrl,
  ).toString();

  const storefrontMethods = [
    {
      name: "支付宝支付",
      provider: "哪吒支付",
      internalValue: "nezha_alipay",
      enabled: isNezhaReady,
    },
    {
      name: "微信支付",
      provider: "哪吒支付",
      internalValue: "nezha_wxpay",
      enabled: isNezhaReady,
    },
    {
      name: "Stripe Checkout",
      provider: "Stripe",
      internalValue: "gateway_reserved",
      enabled: isStripeReady,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">支付设置</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          当前页面只展示支付通道配置状态，不会修改支付流程、webhook、订单发货或库存扣减逻辑。
          密钥类配置只显示是否已配置，不显示原文。
        </p>
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-deal" aria-hidden="true" />
              支付方式总览
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {storefrontMethods.map((method) => (
              <div
                key={method.internalValue}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-primary">{method.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      当前通道：{method.provider}
                    </p>
                  </div>
                  <StatusBadge enabled={method.enabled} />
                </div>
                <p className="mt-3 rounded-md bg-white px-3 py-2 font-mono text-xs text-slate-600">
                  {method.internalValue}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>哪吒支付配置状态</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ValueRow
                label="NEZHA_PAY_ENABLED"
                value={nezhaDiagnostics.nezhaEnabled ? "true" : "false"}
              />
              <ValueRow label="NEZHA_PAY_GATEWAY" value={nezhaPayConfig.gateway} />
              <ValueRow label="NEZHA_PAY_PID" value={nezhaDiagnostics.hasPid} />
              <ValueRow
                label="NEZHA_PAY_PRIVATE_KEY"
                value={nezhaDiagnostics.hasPrivateKey}
                isSecret
              />
              <ValueRow
                label="NEZHA_PAY_PLATFORM_PUBLIC_KEY"
                value={nezhaDiagnostics.hasPlatformPublicKey}
                isSecret
              />
              <ValueRow
                label="NEZHA_PAY_NOTIFY_URL"
                value={nezhaPayConfig.notifyUrl}
              />
              <ValueRow
                label="NEZHA_PAY_RETURN_URL"
                value={nezhaPayConfig.returnUrl}
              />
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                私钥解析状态：
                {nezhaDiagnostics.privateKeyParsed ? "可解析" : "未配置或格式需检查"}
                。本页不会输出私钥、公钥原文。
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stripe 配置状态</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ValueRow label="PAYMENT_PROVIDER" value={paymentGatewayConfig.provider} />
              <ValueRow label="PAYMENT_CURRENCY" value={paymentGatewayConfig.currency} />
              <ValueRow
                label="NEXT_PUBLIC_PAYMENT_GATEWAY_NAME"
                value={paymentGatewayConfig.gatewayName}
              />
              <ValueRow
                label="STRIPE_SECRET_KEY"
                value={Boolean(paymentGatewayConfig.stripeSecretKey)}
                isSecret
              />
              <ValueRow
                label="STRIPE_WEBHOOK_SECRET"
                value={Boolean(paymentGatewayConfig.stripeWebhookSecret)}
                isSecret
              />
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span>当前状态：</span>
                <StatusBadge enabled={isStripeReady} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accentblue" aria-hidden="true" />
              回调地址
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 font-medium text-primary">Webhook 地址</p>
              <p className="break-all font-mono text-xs text-slate-600">
                {nezhaWebhookUrl}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 font-medium text-primary">Return URL</p>
              <p className="break-all font-mono text-xs text-slate-600">
                {nezhaReturnUrl}
              </p>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900">
              付款状态以 webhook 验签或主动查单结果为准，return_url 只用于页面展示，
              不会直接修改订单状态。
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>默认通道与易支付预留</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">DEFAULT_ALIPAY_PROVIDER 当前值</p>
                <p className="mt-1 font-mono text-sm text-primary">
                  {defaultAlipayProvider}
                </p>
              </div>
              <div>
                <p className="text-slate-500">DEFAULT_WXPAY_PROVIDER 当前值</p>
                <p className="mt-1 font-mono text-sm text-primary">
                  {defaultWxpayProvider}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">标准易支付 epay 适配器：已预留 / 未启用</p>
              <p className="mt-1 leading-6">
                后续可接入 pay.mymzf.com 等标准易支付通道，作为支付宝/微信备用通道。
                本阶段不启用 epay，不在前台显示 epay，也不修改默认支付通道。
              </p>
            </div>
            <a
              href="/admin"
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-accentblue hover:underline"
            >
              返回后台首页
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
