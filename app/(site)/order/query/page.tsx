import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockOrder } from "@/lib/mock-data";

export default function OrderQueryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">订单查询</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">通过订单号和联系方式查询</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          第一阶段展示 mock 查询结果，不读取数据库。
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="orderNo">订单号</Label>
            <Input id="orderNo" placeholder="例如 VG202605250001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">联系方式</Label>
            <Input id="contact" placeholder="邮箱或 Telegram" />
          </div>
          <Button variant="deal">查询</Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mock 查询结果</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
            <p>订单号：<span className="font-medium text-primary">{mockOrder.orderNo}</span></p>
            <p>商品名称：<span className="font-medium text-primary">{mockOrder.productName}</span></p>
            <p>数量：<span className="font-medium text-primary">{mockOrder.quantity}</span></p>
            <p>支付状态：<Badge variant="warning">{mockOrder.paymentStatus}</Badge></p>
            <p>发货状态：<Badge variant="success">{mockOrder.deliveryStatus}</Badge></p>
            <p>客服联系方式：<span className="font-medium text-primary">{mockOrder.customerService}</span></p>
          </div>
          <div>
            <p className="mb-2 font-medium text-primary">发货内容</p>
            <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700">
              {mockOrder.deliveryItems.map((item) => (
                <p key={item} className="break-all">{item}</p>
              ))}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/order/success">查看发货结果演示页</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
