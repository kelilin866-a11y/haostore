"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminRetryDeliveryButton({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRetry() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderNo)}/retry-delivery`,
        {
          method: "POST",
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      setMessage(result.message || (result.ok ? "自动发货已处理" : "自动发货失败"));

      if (result.ok) {
        router.refresh();
      }
    } catch {
      setMessage("自动发货请求失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="deal"
        onClick={handleRetry}
        disabled={isLoading}
      >
        {isLoading ? "正在重新发货..." : "重新自动发货"}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
