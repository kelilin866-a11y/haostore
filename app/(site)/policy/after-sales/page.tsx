import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/constants";

const policies = [
  {
    title: "售后条件",
    body: "发货内容缺失、格式明显异常或演示订单信息无法查看时，可凭订单号联系客服核验。",
  },
  {
    title: "不支持售后的情况",
    body: "因用户违规用途、未保存发货内容、错误操作或超出说明范围造成的问题，原则上不支持售后。",
  },
  {
    title: "联系客服方式",
    body: `可通过 Telegram ${siteConfig.customerTelegram} 或邮箱 ${siteConfig.customerEmail} 联系客服。`,
  },
  {
    title: "需要提供订单号",
    body: "售后沟通时请提供订单号、下单联系方式、商品名称和问题截图或文字说明。",
  },
];

export default function AfterSalesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-primary">售后政策</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        售后处理以订单记录、支付状态和后台发货记录为准。遇到问题请提供订单号联系客服核验。
      </p>
      <div className="mt-8 grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.title}>
            <CardHeader>
              <CardTitle>{policy.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-600">{policy.body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
