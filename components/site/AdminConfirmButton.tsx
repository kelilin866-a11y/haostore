"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminConfirmButtonProps = {
  orderNo: string;
  disabled?: boolean;
};

export function AdminConfirmButton({
  orderNo,
  disabled = false,
}: AdminConfirmButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setMessage("");

    if (disabled || isLoading) {
      return;
    }

    const confirmed = window.confirm(
      `确认对订单 ${orderNo} 执行发货？该操作会扣减库存并生成发货内容。`,
    );

    if (!confirmed) {
      return;
    }

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

      setMessage(result.message || (result.ok ? "确认发货成功" : "确认发货失败"));
      if (result.ok) {
        router.refresh();
      }
    } catch {
      setMessage("确认发货失败，请稍后重试");
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
        disabled={disabled || isLoading}
      >
        {isLoading ? "处理中" : disabled ? "不可发货" : "确认发货"}
      </Button>
      {message ? (
        <p
          className={
            message.includes("成功")
              ? "text-xs text-emerald-600"
              : "text-xs text-red-600"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
