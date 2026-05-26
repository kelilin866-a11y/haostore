import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const terms = [
  {
    title: "商品性质",
    body: "本商城展示的商品为虚拟文本类商品，包括账号类、卡密类和教程类资料。第一阶段页面内容均为 mock 演示。",
  },
  {
    title: "用户责任",
    body: "用户应自行确认购买需求和使用场景，并遵守相关平台规则、法律法规和服务条款。",
  },
  {
    title: "禁止用途",
    body: "禁止将商品用于违法违规、欺诈、骚扰、滥发信息或其他侵犯第三方权益的用途。",
  },
  {
    title: "支付说明",
    body: "第一版规划采用后台人工确认付款。本阶段不接入真实支付，不处理真实资金。",
  },
  {
    title: "售后说明",
    body: "如发货内容缺失或格式异常，请提供订单号和联系方式联系客服核验。",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-primary">服务条款</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        以下为第一阶段基础占位文本，后续可根据正式业务和法律要求完善。
      </p>
      <div className="mt-8 grid gap-4">
        {terms.map((term) => (
          <Card key={term.title}>
            <CardHeader>
              <CardTitle>{term.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-600">{term.body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
