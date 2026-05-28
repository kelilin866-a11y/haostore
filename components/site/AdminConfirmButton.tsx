"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminConfirmButton({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      setMessage(result.message || (result.ok ? "处理成功" : "处理失败"));
      if (result.ok) {
        router.refresh();
      }
    } catch {
      setMessage("处理失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        variant="deal"
        size="sm"
        onClick={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? "处理中" : "确认付款并发货"}
      </Button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
