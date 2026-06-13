"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminPaymentQueryButtonProps = {
  orderNo: string;
};

type QueryResponse = {
  ok?: boolean;
  paid?: boolean;
  message?: string;
};

export function AdminPaymentQueryButton({
  orderNo,
}: AdminPaymentQueryButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleQuery() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/nezha/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNo }),
      });
      const result = (await response.json()) as QueryResponse;

      setMessage(result.message || (response.ok ? "查单完成" : "查单失败"));
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("查单失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleQuery}
        disabled={isLoading}
      >
        {isLoading ? "查询中..." : "查询哪吒支付状态"}
      </Button>
      {message ? (
        <p
          className={
            message.includes("成功") || message.includes("已付款")
              ? "text-xs text-emerald-600"
              : "text-xs text-slate-500"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
