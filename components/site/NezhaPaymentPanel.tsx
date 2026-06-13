"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ExternalLink, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type OrderStatusResult = {
  ok: boolean;
  message?: string;
  orderNo?: string;
  paymentStatus?: string;
  orderStatus?: string;
  deliveryStatus?: string;
  paidAtText?: string;
  deliveredAtText?: string;
  totalAmountText?: string;
};

type NezhaQueryResult = {
  ok: boolean;
  paid: boolean;
  message: string;
};

type NezhaPaymentPanelProps = {
  orderNo: string;
  payInfo?: string | null;
  payType?: string | null;
  paymentLabel: string;
  initialPaymentStatus: string;
  initialOrderStatus: string;
  initialDeliveryStatus: string;
  initialPaidAtText: string;
  initialDeliveredAtText: string;
};

function isImagePayInfo(payInfo?: string | null) {
  if (!payInfo) {
    return false;
  }

  return /^https?:\/\//i.test(payInfo) || /^data:image\//i.test(payInfo);
}

export function NezhaPaymentPanel({
  orderNo,
  payInfo,
  payType,
  paymentLabel,
  initialPaymentStatus,
  initialOrderStatus,
  initialDeliveryStatus,
  initialPaidAtText,
  initialDeliveredAtText,
}: NezhaPaymentPanelProps) {
  const [status, setStatus] = useState<OrderStatusResult>({
    ok: true,
    orderNo,
    paymentStatus: initialPaymentStatus,
    orderStatus: initialOrderStatus,
    deliveryStatus: initialDeliveryStatus,
    paidAtText: initialPaidAtText,
    deliveredAtText: initialDeliveredAtText,
  });
  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const isPaid = status.paymentStatus === "paid";
  const isDelivered = status.deliveryStatus === "delivered";
  const isQrcode = payType === "qrcode";
  const canDisplayQrImage = isQrcode && isImagePayInfo(payInfo);
  const statusTitle = useMemo(() => {
    if (isDelivered) {
      return "订单已发货";
    }
    if (isPaid) {
      return "支付成功，等待后台发货";
    }
    return "等待支付结果确认";
  }, [isDelivered, isPaid]);

  async function fetchLocalStatus() {
    const response = await fetch(
      `/api/orders/${encodeURIComponent(orderNo)}/status`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as OrderStatusResult;

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "订单状态查询失败，请稍后重试");
    }

    setStatus(result);
    return result;
  }

  async function refreshStatus() {
    setIsRefreshing(true);
    setMessage("");

    try {
      await fetchLocalStatus();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "订单状态查询失败，请稍后重试",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function checkPaymentResult() {
    setIsRefreshing(true);
    setMessage("");

    try {
      const localStatus = await fetchLocalStatus();

      if (localStatus.paymentStatus === "paid") {
        setMessage("支付成功，订单已付款，等待后台发货。请勿重复付款。");
        return;
      }

      const response = await fetch("/api/payments/nezha/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNo }),
      });
      const result = (await response.json()) as NezhaQueryResult;

      if (!response.ok || !result.ok) {
        setMessage(result.message || "主动查询支付状态失败，请稍后重试");
        return;
      }

      setMessage(result.message);
      await fetchLocalStatus();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "主动查询支付状态失败，请稍后重试",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (isPaid || isDelivered) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 3000);
    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, 600000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, isDelivered, orderNo]);

  return (
    <div className="space-y-4 text-sm leading-7 text-slate-600">
      <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-blue-900">
        <div className="flex items-start gap-3">
          {isPaid ? (
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <Clock className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
          )}
          <div>
            <p className="font-semibold text-primary">{statusTitle}</p>
            <p className="mt-1">
              支付方式：{paymentLabel}。支付后系统会自动检测结果，请勿重复付款。
              如果页面没有自动更新，可点击“我已付款，检查状态”，或稍后通过订单查询查看。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <p>支付状态：{status.paymentStatus}</p>
        <p>订单状态：{status.orderStatus}</p>
        <p>发货状态：{status.deliveryStatus}</p>
        <p>支付时间：{status.paidAtText}</p>
      </div>

      {!isPaid && isQrcode ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-primary">
            <QrCode className="h-5 w-5 text-deal" aria-hidden="true" />
            扫码支付
          </div>
          <p className="mb-4 text-slate-600">
            请使用微信或支付宝扫码支付，支付后页面会自动检测结果，请勿重复付款。
          </p>
          {canDisplayQrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payInfo || ""}
              alt={`${paymentLabel}二维码`}
              className="mx-auto h-56 w-56 rounded-lg border border-slate-200 bg-white object-contain p-2"
            />
          ) : payInfo ? (
            <div className="break-all rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-600">
              {payInfo}
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              支付二维码暂不可用，请联系客服或选择其他支付方式。
            </div>
          )}
        </div>
      ) : null}

      {isDelivered ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          订单已发货，可前往订单查询查看发货内容。
        </div>
      ) : isPaid ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          支付成功，订单已付款，等待后台发货。请勿重复付款。
        </div>
      ) : null}

      {timedOut && !isPaid ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
          暂未检测到付款。如果你已经付款，请点击“我已付款，检查状态”，
          或稍后通过订单查询查看订单状态。
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800">
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {payInfo && !isQrcode ? (
          <Button className="bg-[#14B8A6] text-white hover:bg-[#0F9F93]" asChild>
            <a href={payInfo} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              打开支付页面
            </a>
          </Button>
        ) : isQrcode ? null : (
          <Button disabled>支付页面暂不可用</Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={checkPaymentResult}
          disabled={isRefreshing}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {isRefreshing ? "正在检查" : "我已付款，检查状态"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/order/query">返回订单查询</Link>
        </Button>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        本页面只读取本地订单状态，不会直接根据第三方页面返回参数修改订单。
        真正付款确认以支付回调验签成功后的状态为准；主动查单仅作为补充确认方式。
      </p>
    </div>
  );
}
