import { redirect } from "next/navigation";

import { AdminConfirmButton } from "@/components/site/AdminConfirmButton";
import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      deliveryStatus: "pending",
      orderStatus: {
        in: ["pending_payment", "paid"],
      },
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
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
            <h1 className="mt-2 text-3xl font-bold text-primary">
              待人工确认订单
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              当前登录账号：{session.username}。已支付但待发货的订单会保留在这里，由管理员人工确认后发货。
            </p>
          </div>
          <AdminLogoutButton />
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无待确认发货订单。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{order.orderNo}</CardTitle>
                    <p className="mt-2 text-sm text-slate-500">
                      联系方式：{order.contact} / 创建时间：
                      {order.createdAt.toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="warning">{order.paymentStatus}</Badge>
                    <Badge variant="outline">{order.deliveryStatus}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 md:grid-cols-[1fr_140px_80px_120px]"
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-500">
                    总金额：
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(Number(order.totalAmount))}
                    </span>
                  </p>
                  <AdminConfirmButton orderNo={order.orderNo} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
