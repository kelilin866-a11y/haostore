import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { AdminConfirmButton } from "@/components/site/AdminConfirmButton";
import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams?: {
    status?: string;
    q?: string;
  };
};

const statusFilters = [
  { label: "全部", value: "all" },
  { label: "未支付", value: "pending_payment" },
  { label: "已支付待发货", value: "paid_pending_delivery" },
  { label: "已发货", value: "completed" },
  { label: "已取消/失败", value: "cancelled_or_failed" },
];

function getStatusWhere(status: string): Prisma.OrderWhereInput {
  if (status === "pending_payment") {
    return { paymentStatus: "pending" };
  }

  if (status === "paid_pending_delivery") {
    return { paymentStatus: "paid", deliveryStatus: "pending" };
  }

  if (status === "completed") {
    return {
      OR: [{ deliveryStatus: "delivered" }, { orderStatus: "completed" }],
    };
  }

  if (status === "cancelled_or_failed") {
    return {
      OR: [
        { paymentStatus: "failed" },
        { deliveryStatus: "failed" },
        { orderStatus: "cancelled" },
      ],
    };
  }

  return {};
}

function getSearchWhere(keyword: string): Prisma.OrderWhereInput {
  if (!keyword) {
    return {};
  }

  return {
    OR: [
      { orderNo: { contains: keyword, mode: "insensitive" } },
      { contact: { contains: keyword, mode: "insensitive" } },
    ],
  };
}

function buildOrdersHref(status: string, keyword: string) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }
  if (keyword) {
    params.set("q", keyword);
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

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

  if (label === "已取消/失败") {
    return "warning";
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

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/orders");
  }

  const activeStatus = statusFilters.some(
    (filter) => filter.value === searchParams?.status,
  )
    ? searchParams?.status || "all"
    : "all";
  const keyword = searchParams?.q?.trim() || "";
  const whereParts = [getStatusWhere(activeStatus), getSearchWhere(keyword)].filter(
    (item) => Object.keys(item).length > 0,
  );
  const where: Prisma.OrderWhereInput =
    whereParts.length > 0 ? { AND: whereParts } : {};

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      deliveryItems: {
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accentblue">后台管理</p>
            <h1 className="mt-2 text-3xl font-bold text-primary">订单管理</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              当前登录账号：{session.username}。已通过 Stripe webhook 确认付款、
              但尚未发货的订单，可由后台管理员人工确认发货。
            </p>
          </div>
          <AdminLogoutButton />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="grid gap-4 p-5">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={activeStatus === filter.value ? "deal" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildOrdersHref(filter.value, keyword)}>
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" action="/admin/orders">
            {activeStatus !== "all" ? (
              <input type="hidden" name="status" value={activeStatus} />
            ) : null}
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              name="q"
              defaultValue={keyword}
              placeholder="搜索订单号或联系方式"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="deal">
                搜索
              </Button>
              {keyword ? (
                <Button variant="outline" asChild>
                  <Link href={buildOrdersHref(activeStatus, "")}>清空</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无符合条件的订单。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {orders.map((order) => {
            const canConfirmDelivery =
              order.paymentStatus === "paid" && order.deliveryStatus === "pending";
            const statusLabel = getOrderStatusLabel(order);

            return (
              <Card key={order.id}>
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
                        variant={
                          order.paymentStatus === "paid" ? "success" : "warning"
                        }
                      >
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Badge>
                      <Badge
                        variant={
                          order.deliveryStatus === "delivered"
                            ? "success"
                            : "outline"
                        }
                      >
                        {getDeliveryStatusLabel(order.deliveryStatus)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 md:grid-cols-[1fr_150px_80px_120px]"
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

                  <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <p>
                      总金额：
                      <span className="font-semibold text-primary">
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </p>
                    <p>创建时间：{formatDateTime(order.createdAt)}</p>
                    <p>支付时间：{formatDateTime(order.paidAt)}</p>
                    <p>发货时间：{formatDateTime(order.deliveredAt)}</p>
                  </div>

                  <div
                    className={cn(
                      "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                      !canConfirmDelivery && "md:justify-end",
                    )}
                  >
                    <p className="text-sm text-slate-500">
                      {statusLabel === "已支付待发货"
                        ? "该订单已付款，等待后台管理员人工确认发货。"
                        : statusLabel === "已发货"
                          ? `该订单已发货，已分配 ${order.deliveryItems.length} 条库存内容。`
                          : statusLabel === "已取消/失败"
                            ? "该订单处于取消或失败状态。"
                            : "该订单尚未完成在线支付。"}
                    </p>
                    <div className="flex flex-wrap items-start gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.orderNo}`}>
                          查看详情
                        </Link>
                      </Button>
                      <AdminConfirmButton
                        orderNo={order.orderNo}
                        disabled={!canConfirmDelivery}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
