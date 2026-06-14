import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminConfirmButton } from "@/components/site/AdminConfirmButton";
import { AdminDeliveryContentForm } from "@/components/site/AdminDeliveryContentForm";
import { AdminPaymentQueryButton } from "@/components/site/AdminPaymentQueryButton";
import { AdminRetryDeliveryButton } from "@/components/site/AdminRetryDeliveryButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { paymentMethodLabels } from "@/lib/payments/methods";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: {
    orderNo: string;
  };
};

function getOrderStatusLabel({
  paymentStatus,
  deliveryStatus,
  orderStatus,
}: {
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
}) {
  if (
    paymentStatus === "failed" ||
    deliveryStatus === "failed" ||
    orderStatus === "cancelled"
  ) {
    return "已取消/失败";
  }

  if (deliveryStatus === "delivered" || orderStatus === "completed") {
    return "已发货";
  }

  if (paymentStatus === "paid" && deliveryStatus === "pending") {
    return "已支付待发货";
  }

  return "未支付";
}

function getOrderStatusVariant(label: string) {
  if (label === "已发货") {
    return "success";
  }

  if (label === "已支付待发货") {
    return "deal";
  }

  return "warning";
}

function getPaymentStatusLabel(status: string) {
  return status === "paid" ? "已支付" : status === "failed" ? "支付失败" : "未支付";
}

function getDeliveryStatusLabel(status: string) {
  if (status === "delivered") {
    return "已发货";
  }

  if (status === "failed") {
    return "发货失败";
  }

  return "待发货";
}

function isNezhaPaymentMethod(method: string) {
  return method === "nezha_alipay" || method === "nezha_wxpay";
}

function stringifyJsonValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const payload = value as Record<string, unknown>;
  const candidates = [
    payload.money,
    payload.amount,
    payload.total_amount,
    payload.trade_no,
    payload.api_trade_no,
    payload.out_trade_no,
    payload.transactionId,
    payload.id,
  ];

  return candidates
    .filter((item) => item !== undefined && item !== null && String(item) !== "")
    .map((item) => String(item))
    .join(" / ");
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=/admin/orders/${params.orderNo}`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNo: params.orderNo },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      deliveryItems: {
        orderBy: { createdAt: "asc" },
        include: {
          inventoryItem: {
            select: {
              id: true,
              status: true,
              soldAt: true,
            },
          },
        },
      },
      paymentRecords: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const statusLabel = getOrderStatusLabel(order);
  const canConfirmDelivery =
    order.paymentStatus === "paid" && order.deliveryStatus === "pending";
  const isDelivered = order.deliveryStatus === "delivered";
  const deliveryContent = order.deliveryItems
    .map((item) => item.content)
    .join("\n");
  const latestPaymentRecord = order.paymentRecords[0];
  const paymentLogs = await prisma.paymentLog.findMany({
    where: {
      OR: [{ orderId: order.id }, { orderNo: order.orderNo }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const canQueryNezhaPayment =
    isNezhaPaymentMethod(order.paymentMethod) && order.paymentStatus !== "paid";
  const thirdPartyTradeNo = latestPaymentRecord?.transactionId || "-";
  const autoDeliveryStatus = order.autoDeliveryStatus || "未触发";
  const autoDeliveryMessage = order.autoDeliveryMessage || "-";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accentblue">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">订单详情</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            查看订单信息、库存分配和发货内容。确认发货仍使用现有库存扣减逻辑。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">返回订单列表</Link>
        </Button>
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{order.orderNo}</CardTitle>
                <p className="mt-2 text-sm text-slate-500">
                  联系方式：{order.contact}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getOrderStatusVariant(statusLabel)}>
                  {statusLabel}
                </Badge>
                <Badge
                  variant={order.paymentStatus === "paid" ? "success" : "warning"}
                >
                  {getPaymentStatusLabel(order.paymentStatus)}
                </Badge>
                <Badge
                  variant={order.deliveryStatus === "delivered" ? "success" : "outline"}
                >
                  {getDeliveryStatusLabel(order.deliveryStatus)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p>
                总金额：
                <span className="font-semibold text-primary">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </p>
              <p>创建时间：{formatDateTime(order.createdAt)}</p>
              <p>支付时间：{formatDateTime(order.paidAt)}</p>
              <p>发货时间：{formatDateTime(order.deliveredAt)}</p>
              <p>支付状态：{order.paymentStatus}</p>
              <p>发货状态：{order.deliveryStatus}</p>
              <p>自动发货状态：{autoDeliveryStatus}</p>
              <p className="break-all lg:col-span-2">
                自动发货说明：{autoDeliveryMessage}
              </p>
              <p>自动发货尝试时间：{formatDateTime(order.autoDeliveryAttemptedAt)}</p>
              <p className="break-all">
                供货商交易号：{order.supplierTradeNo || "-"}
              </p>
            </div>

            <div>
              <p className="mb-2 font-medium text-primary">商品明细</p>
              <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 md:grid-cols-[1fr_160px_80px_120px]"
                  >
                    <span className="font-medium text-primary">
                      {item.productTitleSnapshot}
                    </span>
                    <span>{item.variantNameSnapshot}</span>
                    <span>数量 {item.quantity}</span>
                    <span>{formatCurrency(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支付信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p>
                前台支付方式：
                <span className="font-medium text-primary">
                  {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                </span>
              </p>
              <p>
                内部支付通道：
                <span className="font-mono text-xs text-primary">
                  {order.paymentMethod}
                </span>
              </p>
              <p>支付状态：{order.paymentStatus}</p>
              <p>订单状态：{order.orderStatus}</p>
              <p>发货状态：{order.deliveryStatus}</p>
              <p>支付时间：{formatDateTime(order.paidAt)}</p>
              <p className="break-all lg:col-span-2">
                第三方交易号：
                <span className="font-mono text-xs text-primary">
                  {thirdPartyTradeNo}
                </span>
              </p>
            </div>

            {order.paymentStatus === "paid" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                已支付，无需查单。
              </div>
            ) : canQueryNezhaPayment ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                <p className="mb-3">
                  当前订单使用支付宝/微信支付且尚未确认付款，可手动查询哪吒支付状态。
                </p>
                <AdminPaymentQueryButton orderNo={order.orderNo} />
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                当前支付方式无需哪吒查单。
              </div>
            )}

            <div>
              <p className="mb-2 font-medium text-primary">最近 10 条支付日志</p>
              {paymentLogs.length ? (
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">时间</th>
                        <th className="px-3 py-2 font-medium">事件</th>
                        <th className="px-3 py-2 font-medium">结果</th>
                        <th className="px-3 py-2 font-medium">通道</th>
                        <th className="px-3 py-2 font-medium">消息</th>
                        <th className="px-3 py-2 font-medium">金额/交易号</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paymentLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">
                            {log.event}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={log.success ? "success" : "warning"}>
                              {log.success ? "成功" : "失败"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {log.channel || log.provider}
                          </td>
                          <td className="max-w-sm px-3 py-2 text-slate-600">
                            {log.message || "-"}
                          </td>
                          <td className="max-w-sm break-all px-3 py-2 font-mono text-slate-600">
                            {stringifyJsonValue(log.responsePayload) || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  暂无支付日志。
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>发货内容</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isDelivered ? (
              <>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  订单已发货。下方内容来自已分配库存，可在保持行数一致的前提下编辑保存。
                </div>
                <AdminDeliveryContentForm
                  orderNo={order.orderNo}
                  content={deliveryContent}
                />
                <div className="grid gap-2 text-xs text-slate-500">
                  {order.deliveryItems.map((item, index) => (
                    <p key={item.id}>
                      #{index + 1} 库存记录：
                      {item.inventoryItemId || "未绑定库存"} / 状态：
                      {item.inventoryItem?.status || "-"} / 扣减时间：
                      {formatDateTime(item.inventoryItem?.soldAt)}
                    </p>
                  ))}
                </div>
              </>
            ) : canConfirmDelivery ? (
              <div className="grid gap-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  订单已付款但尚未发货。点击确认后，系统会使用现有库存扣减逻辑分配库存并生成发货内容。
                </div>
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  <p className="mb-3 font-medium">自动发货</p>
                  <p className="mb-3">
                    如果自动发货失败，可在这里重新触发。失败不会取消订单，也不会退款，订单仍保持已付款待发货。
                  </p>
                  <AdminRetryDeliveryButton orderNo={order.orderNo} />
                </div>
                <textarea
                  value="确认发货后将显示已分配的库存内容。"
                  readOnly
                  rows={4}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
                <AdminConfirmButton orderNo={order.orderNo} />
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                当前订单尚未进入可发货状态，未展示任何发货内容。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
