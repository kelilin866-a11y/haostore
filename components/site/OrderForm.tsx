"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type VariantOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
  availableStock: number;
};

type OrderFormProps = {
  productId: string;
  variants: VariantOption[];
};

const paymentMethods = [
  { value: "manual_alipay", label: "人工支付宝" },
  { value: "manual_wechat", label: "人工微信" },
  { value: "manual_usdt", label: "人工 USDT" },
  { value: "gateway_reserved", label: "支付网关预留" },
];

const invalidContactMessage =
  "请输入有效联系方式，例如邮箱、Telegram、手机号或微信号";

function isValidContact(value: string) {
  const contact = value.trim();
  return contact.length >= 5;
}

export function OrderForm({ productId, variants }: OrderFormProps) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [contact, setContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual_alipay");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const total = useMemo(() => {
    return selectedVariant ? selectedVariant.price * quantity : 0;
  }, [quantity, selectedVariant]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isValidContact(contact)) {
      setMessage(invalidContactMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
          contact,
          paymentMethod,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        redirectUrl?: string;
      };

      if (!result.ok || !result.redirectUrl) {
        setMessage(result.message || "订单创建失败，请稍后重试");
        return;
      }

      router.push(result.redirectUrl);
    } catch {
      setMessage("订单创建失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        当前商品暂无可购买规格。
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="variantId">规格选择</Label>
        <select
          id="variantId"
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} / {formatCurrency(variant.price)} / 库存{" "}
              {variant.availableStock} / {variant.sku}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">数量选择</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={selectedVariant?.availableStock || 1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">联系方式</Label>
        <Input
          id="contact"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="邮箱、Telegram 或手机号"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">支付方式</Label>
        <select
          id="paymentMethod"
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
        >
          {paymentMethods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">价格合计</span>
          <span className="text-xl font-semibold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {message ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="deal"
        size="lg"
        className="w-full"
        disabled={isSubmitting || !selectedVariant || selectedVariant.availableStock < quantity}
      >
        {isSubmitting ? "正在创建订单" : "立即购买"}
      </Button>
      <p className="text-xs leading-5 text-slate-500">
        本阶段只创建待人工确认付款订单，不扣减库存、不自动发货、不接入真实支付。
      </p>
    </form>
  );
}
