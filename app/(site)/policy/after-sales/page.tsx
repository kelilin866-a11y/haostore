import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function splitContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function AfterSalesPage() {
  const settings = await getSiteSettings();
  const sections = splitContent(settings.after_sales_page_content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-primary">
        {settings.after_sales_page_title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        售后处理以订单记录、支付状态和后台发货记录为准。遇到问题请提供订单号联系客服核验。
      </p>
      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <Card key={section.slice(0, 40)}>
            <CardContent className="whitespace-pre-line p-5 text-sm leading-7 text-slate-600">
              {section}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
