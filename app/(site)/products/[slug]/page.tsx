import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { products } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products.find((item) => item.slug === params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
            {product.title} 主图占位
          </div>
          <div className="mt-8 grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accentblue" aria-hidden="true" />
                  商品说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
                <p>{product.description}</p>
                <p>
                  本阶段页面仅展示静态购买流程。点击立即购买会进入支付成功/发货结果演示页，不会发起真实支付，也不会写入数据库。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                  注意事项
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm text-slate-600">
                  {product.notice.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-deal" aria-hidden="true" />
                  发货与售后说明
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-primary">发货格式</p>
                  <p className="mt-2 rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700">
                    {product.deliveryFormat}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-primary">售后说明</p>
                  <p className="mt-2 leading-6">{product.afterSales}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="deal">{product.category}</Badge>
                <Badge variant="outline">发货类型：文本</Badge>
              </div>
              <CardTitle className="text-2xl leading-8">{product.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">单价</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                </div>
                <p className="text-sm text-slate-500">库存 {product.stock}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="spec">规格选择</Label>
                <select
                  id="spec"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                  defaultValue={product.specs[0]}
                >
                  {product.specs.map((spec) => (
                    <option key={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">数量选择</Label>
                <Input id="quantity" type="number" min={1} defaultValue={1} />
              </div>

              <div className="rounded-md bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">价格合计</span>
                  <span className="text-xl font-semibold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>

              <Button variant="deal" size="lg" className="w-full" asChild>
                <Link href="/order/success">立即购买</Link>
              </Button>
              <p className="text-xs leading-5 text-slate-500">
                演示阶段不会创建真实订单，也不会进入真实支付通道。
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
