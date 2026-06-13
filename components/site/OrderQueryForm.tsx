"use client";

import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type QueryResult = {
  orderNo: string;
  contact: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  items: {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  deliveryItems: {
    id: string;
    content: string;
  }[];
};

type OrderQueryFormProps = {
  contactPlaceholder: string;
  buttonText: string;
  helpText: string;
};

function getOrderStatusText(order: QueryResult) {
  if (order.deliveryStatus === "delivered") {
    return "已发货";
  }

  if (order.paymentStatus === "paid") {
    return "已付款，等待发货";
  }

  return "待支付";
}

function getOrderStatusVariant(order: QueryResult) {
  if (order.deliveryStatus === "delivered") {
    return "success" as const;
  }

  if (order.paymentStatus === "paid") {
    return "deal" as const;
  }

  return "warning" as const;
}

export function OrderQueryForm({
  contactPlaceholder,
  buttonText,
  helpText,
}: OrderQueryFormProps) {
  const [orderNo, setOrderNo] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setOrders([]);

    if (!orderNo.trim() && !contact.trim()) {
      setMessage("请输入订单号或联系方式");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/orders/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, contact }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        orders?: QueryResult[];
      };

      if (!result.ok || !result.orders) {
        setMessage(result.message || "查询失败，请检查订单信息");
        return;
      }

      setOrders(result.orders);
    } catch {
      setMessage("查询失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="orderNo">订单号</Label>
              <Input
                id="orderNo"
                value={orderNo}
                onChange={(event) => setOrderNo(event.target.value)}
                placeholder="例如 HM202605240018"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">联系方式</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder={contactPlaceholder}
              />
            </div>
            <Button variant="deal" type="submit" disabled={isLoading}>
              {isLoading ? "查询中..." : buttonText}
            </Button>
          </CardContent>
        </form>
      </Card>

      {helpText ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
          {helpText}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="grid gap-5">
          {orders.map((order) => {
            const isDelivered = order.deliveryStatus === "delivered";

            return (
              <Card key={order.orderNo}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    <span>订单 {order.orderNo}</span>
                    <Badge variant={getOrderStatusVariant(order)}>
                      {getOrderStatusText(order)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
                    <p>
                      总金额：
                      <span className="font-medium text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </p>
                    <p>
                      联系方式：
                      <span className="font-medium text-primary">
                        {order.contact}
                      </span>
                    </p>
                    <p>创建时间：{formatDateTime(order.createdAt)}</p>
                    <p>支付时间：{formatDateTime(order.paidAt)}</p>
                    <p>发货时间：{formatDateTime(order.deliveredAt)}</p>
                    <p>
                      订单状态：
                      <span className="font-medium text-primary">
                        {getOrderStatusText(order)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 font-medium text-primary">商品明细</p>
                    <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid gap-2 sm:grid-cols-[1fr_120px_80px_120px]"
                        >
                          <span className="font-medium text-primary">
                            {item.productName}
                          </span>
                          <span>{item.variantName}</span>
                          <span>数量 {item.quantity}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isDelivered ? (
                    <div>
                      <p className="mb-2 font-medium text-primary">发货内容</p>
                      <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700">
                        {order.deliveryItems.map((item) => (
                          <p key={item.id} className="break-all">
                            {item.content}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      {order.paymentStatus === "paid"
                        ? "已付款，等待后台管理员人工确认发货。确认前不会展示任何发货内容。"
                        : "待支付。支付成功后系统会通过支付回调自动确认付款状态，发货仍由后台管理员人工确认。"}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
