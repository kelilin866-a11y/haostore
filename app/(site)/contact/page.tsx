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
          {settings.contact_page_title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {settings.contact_page_description}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-deal" aria-hidden="true" />
              {settings.contact_telegram_label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            <p>{settings.customer_service_telegram}</p>
            <p>{settings.contact_notice}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accentblue" aria-hidden="true" />
              {settings.contact_email_label}
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
