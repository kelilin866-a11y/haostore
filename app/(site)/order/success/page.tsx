import Link from "next/link";
import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-deal">
            <Clock3 className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">订单状态确认中</CardTitle>
          <p className="text-sm text-slate-500">
            当前页面不代表真实支付成功，也不会触发自动发货。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Stripe Checkout 返回页面只能作为跳转结果提示。真实付款状态以
            Stripe webhook 更新后的订单状态为准；发货仍需后台管理员人工确认。
          </div>
          <div className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            未完成后台发货确认前，系统不会展示任何发货内容。请使用订单号或下单联系方式查询最新订单状态。
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="deal" asChild>
              <Link href="/order/query">查询订单</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">返回产品中心</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
