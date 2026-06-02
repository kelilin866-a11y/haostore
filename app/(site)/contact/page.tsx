import { Mail, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">联系客服</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          售前与售后支持
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          有问题请提供订单号联系客服，便于快速核验订单和发货内容。
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-deal" aria-hidden="true" />
              Telegram 客服
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            <p>{settings.customer_service_telegram}</p>
            <p>请说明咨询商品、订单号和遇到的问题。</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accentblue" aria-hidden="true" />
              邮箱客服
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            <p>{settings.customer_service_email}</p>
            <p>售后问题请在邮件标题中附带订单号。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
