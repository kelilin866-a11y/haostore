"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminDeliveryContentFormProps = {
  orderNo: string;
  content: string;
  disabled?: boolean;
};

export function AdminDeliveryContentForm({
  orderNo,
  content,
  disabled = false,
}: AdminDeliveryContentFormProps) {
  const router = useRouter();
  const [deliveryContent, setDeliveryContent] = useState(content);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setMessage("");

    if (disabled || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/orders/delivery-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo,
          deliveryContent,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      setMessage(result.message || (result.ok ? "发货内容已保存" : "保存失败"));
      if (result.ok) {
        router.refresh();
      }
    } catch {
      setMessage("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <textarea
        value={deliveryContent}
        onChange={(event) => setDeliveryContent(event.target.value)}
        rows={Math.max(5, Math.min(12, deliveryContent.split(/\r?\n/).length + 2))}
        disabled={disabled}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue disabled:bg-slate-50 disabled:text-slate-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="deal"
          onClick={handleSave}
          disabled={disabled || isSaving}
        >
          {isSaving ? "保存中" : "保存发货内容"}
        </Button>
        {message ? (
          <p
            className={
              message.includes("已保存")
                ? "text-sm text-emerald-600"
                : "text-sm text-red-600"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
