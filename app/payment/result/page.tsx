import Link from "next/link";
import { CheckCircle2, Clock, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PaymentResultPageProps = {
  searchParams?: {
    orderNo?: string;
    out_trade_no?: string;
  };
};

export default async function PaymentResultPage({
  searchParams,
}: PaymentResultPageProps) {
  const orderNo = searchParams?.orderNo || searchParams?.out_trade_no || "";
  const order = orderNo
    ? await prisma.order.findUnique({
        where: { orderNo },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : null;
  const isPaid = order?.paymentStatus === "paid";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Card className="border-[#E2E8F0] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            {isPaid ? (
              <CheckCircle2 className="h-6 w-6 text-[#10B981]" aria-hidden="true" />
            ) : (
              <Clock className="h-6 w-6 text-[#F59E0B]" aria-hidden="true" />
            )}
            {isPaid ? "支付状态已确认" : "支付结果确认中"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm leading-7 text-[#64748B]">
          <p>
            页面不会直接信任支付返回参数。真实付款状态以服务端支付回调验签后的本地订单状态为准。
          </p>

          {order ? (
            <div className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-2">
              <p>
                订单号：
                <span className="font-semibold text-[#0F172A]">
                  {order.orderNo}
                </span>
              </p>
              <p>
                总金额：
                <span className="font-semibold text-[#0F172A]">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </p>
              <p>
                支付状态：
                <Badge variant={isPaid ? "success" : "warning"}>
                  {order.paymentStatus}
                </Badge>
              </p>
              <p>
                发货状态：
                <Badge variant={order.deliveryStatus === "delivered" ? "success" : "outline"}>
                  {order.deliveryStatus}
                </Badge>
              </p>
              <p>创建时间：{formatDateTime(order.createdAt)}</p>
              <p>支付时间：{formatDateTime(order.paidAt)}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              暂未找到本地订单。请稍后通过订单查询页面查看，或联系客服提供支付平台订单号。
            </div>
          )}

          {!isPaid ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              如果你已经完成支付但这里仍显示确认中，通常是支付回调还在处理中。请稍后刷新，或使用订单查询查看最新状态。
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
              付款状态已确认。发货仍由后台管理员人工确认，确认后可通过订单查询查看发货内容。
            </div>
          )}

          {order?.items.length ? (
            <div>
              <p className="mb-2 font-semibold text-[#0F172A]">商品明细</p>
              <div className="grid gap-2 rounded-xl border border-[#E2E8F0] bg-white p-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 sm:grid-cols-[1fr_120px_80px_120px]"
                  >
                    <span className="font-medium text-[#0F172A]">
                      {item.productTitleSnapshot}
                    </span>
                    <span>{item.variantNameSnapshot}</span>
                    <span>数量 {item.quantity}</span>
                    <span>{formatCurrency(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {order ? (
              <Button className="bg-[#14B8A6] text-white hover:bg-[#0F9F93]" asChild>
                <Link href={`/order/${order.orderNo}/pay`}>
                  查看订单状态
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/order/query">
                <Search className="h-4 w-4" aria-hidden="true" />
                订单查询
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
