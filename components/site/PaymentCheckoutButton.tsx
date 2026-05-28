"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PaymentCheckoutButton({ orderNo }: { orderNo: string }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        checkoutUrl?: string;
        redirectUrl?: string;
      };

      if (!result.ok) {
        setMessage(result.message || "在线支付创建失败，请稍后重试");
        return;
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      setMessage("在线支付创建失败，请稍后重试");
    } catch {
      setMessage("在线支付创建失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="deal"
        size="lg"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? "正在创建支付" : "前往在线支付"}
      </Button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
