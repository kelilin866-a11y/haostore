import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrder } from "@/lib/mock-data";

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">订单演示成功</CardTitle>
          <p className="text-sm text-slate-500">
            当前页面为静态发货结果演示，不代表真实支付完成。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <p>订单号：<span className="font-semibold text-primary">{mockOrder.orderNo}</span></p>
            <p className="mt-2">商品：<span className="font-semibold text-primary">{mockOrder.productName}</span></p>
          </div>
          <div>
            <p className="mb-2 font-medium text-primary">Mock 发货内容</p>
            <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700">
              {mockOrder.deliveryItems.map((item) => (
                <p key={item} className="break-all">{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            请及时保存发货内容。若后续查询或售后，请提供订单号和下单联系方式。
          </div>
          <Button variant="deal" asChild>
            <Link href="/order/query">查询订单</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
