"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  {
    value: "gateway_reserved",
    label: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_NAME || "Stripe Checkout 在线支付",
  },
  { value: "manual_alipay", label: "支付宝备用通道" },
  { value: "manual_wechat", label: "微信备用通道" },
  { value: "manual_usdt", label: "USDT 备用通道" },
];

const invalidContactMessage =
  "请输入有效联系方式，例如邮箱、Telegram、手机号或微信号";

function isValidContact(value: string) {
  const contact = value.trim();
  return contact.length >= 5;
}

function getInitialVariantId(variants: VariantOption[]) {
  return (
    variants.find((variant) => variant.availableStock > 0)?.id ??
    variants[0]?.id ??
    ""
  );
}

function clampQuantity(value: number, maxStock: number) {
  if (maxStock <= 0) {
    return 1;
  }

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.min(Math.floor(value), maxStock);
}

export function OrderForm({ productId, variants }: OrderFormProps) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(() => getInitialVariantId(variants));
  const [quantity, setQuantity] = useState(1);
  const [contact, setContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("gateway_reserved");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const hasPurchasableVariant = variants.some(
    (variant) => variant.availableStock > 0,
  );
  const selectedStock = selectedVariant?.availableStock ?? 0;
  const canPurchaseSelectedVariant = selectedStock > 0;

  const total = useMemo(() => {
    return selectedVariant && canPurchaseSelectedVariant
      ? selectedVariant.price * quantity
      : 0;
  }, [canPurchaseSelectedVariant, quantity, selectedVariant]);

  useEffect(() => {
    const nextVariantId = getInitialVariantId(variants);
    setVariantId((currentVariantId) => {
      const currentVariant = variants.find(
        (variant) => variant.id === currentVariantId,
      );

      if (currentVariant && currentVariant.availableStock > 0) {
        return currentVariantId;
      }

      return nextVariantId;
    });
  }, [variants]);

  useEffect(() => {
    setQuantity((currentQuantity) =>
      clampQuantity(currentQuantity, selectedStock),
    );
  }, [selectedStock]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!selectedVariant) {
      setMessage("请选择有效规格");
      return;
    }

    if (selectedVariant.availableStock <= 0) {
      setMessage("该规格已售罄，请选择其他规格");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("购买数量必须是正整数");
      return;
    }

    if (quantity > selectedVariant.availableStock) {
      setMessage(`库存不足，当前库存 ${selectedVariant.availableStock}`);
      return;
    }

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
          className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          value={variantId}
          onChange={(event) => {
            const nextVariant = variants.find(
              (variant) => variant.id === event.target.value,
            );
            setVariantId(event.target.value);
            setQuantity(clampQuantity(quantity, nextVariant?.availableStock ?? 0));
          }}
        >
          {variants.map((variant) => (
            <option
              key={variant.id}
              value={variant.id}
              disabled={variant.availableStock <= 0}
            >
              {variant.name} / {formatCurrency(variant.price)} /{" "}
              {variant.availableStock > 0
                ? `库存 ${variant.availableStock}`
                : "已售罄"}{" "}
              / {variant.sku}
            </option>
          ))}
        </select>
        {selectedVariant ? (
          <div className="rounded-xl border border-[#14B8A6] bg-[#ECFDF5] p-3 text-sm text-[#047857]">
            <p className="mb-2 text-xs font-semibold text-[#047857]">
              已选规格
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#0F172A]">
                {selectedVariant.name}
              </span>
              <span className="font-semibold text-[#1E3A8A]">
                {formatCurrency(selectedVariant.price)}
              </span>
              <span>
                {selectedVariant.availableStock > 0
                  ? `库存 ${selectedVariant.availableStock}`
                  : "已售罄"}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">数量选择</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={Math.max(selectedStock, 1)}
          value={quantity}
          disabled={!canPurchaseSelectedVariant}
          className="h-11 border-[#E2E8F0] bg-white focus-visible:ring-2 focus-visible:ring-teal-100"
          onChange={(event) =>
            setQuantity(clampQuantity(Number(event.target.value), selectedStock))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">联系方式</Label>
        <Input
          id="contact"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="邮箱、Telegram、手机号或微信号"
          className="h-11 border-[#E2E8F0] bg-white focus-visible:ring-2 focus-visible:ring-teal-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">支付方式</Label>
        <select
          id="paymentMethod"
          className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          disabled={!canPurchaseSelectedVariant}
        >
          {paymentMethods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#64748B]">价格合计</span>
          <span className="text-2xl font-bold text-[#1E3A8A]">
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
        size="lg"
        className="w-full bg-[#14B8A6] text-white hover:bg-[#0F9F93]"
        disabled={isSubmitting || !canPurchaseSelectedVariant}
      >
        {!hasPurchasableVariant
          ? "暂无库存"
          : isSubmitting
            ? "正在创建订单"
            : "立即购买"}
      </Button>
      <p className="text-xs leading-5 text-[#64748B]">
        支持 Stripe Checkout 在线支付。支付成功后，系统会通过支付回调确认付款状态。发货仍由后台管理员人工确认，确认前不会展示任何发货内容。
      </p>
    </form>
  );
}
