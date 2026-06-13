import { getNezhaPayConfig } from "@/lib/payments/nezha";

export type StorefrontPaymentOption = {
  value: string;
  label: string;
  description: string;
};

export type DefaultPaymentProviders = {
  alipay: string;
  wxpay: string;
};

export const paymentMethodLabels: Record<string, string> = {
  gateway_reserved: "Stripe Checkout",
  nezha_alipay: "支付宝支付",
  nezha_wxpay: "微信支付",
  manual_alipay: "人工支付",
  manual_wechat: "人工支付",
  manual_usdt: "人工支付",
};

export async function getDefaultPaymentProviders(): Promise<DefaultPaymentProviders> {
  const config = await getNezhaPayConfig();

  return {
    alipay: config.defaultAlipayProvider || "nezha",
    wxpay: config.defaultWxpayProvider || "nezha",
  };
}

export function getDefaultAlipayMethod(provider = "nezha") {
  // epay_alipay is reserved for a later adapter phase. Keep Nezha as the only
  // active Alipay channel until the database enum and adapter are expanded.
  return provider === "epay" ? "nezha_alipay" : "nezha_alipay";
}

export function getDefaultWxpayMethod(provider = "nezha") {
  // epay_wxpay is reserved for a later adapter phase. Keep Nezha as the only
  // active WeChat channel until the database enum and adapter are expanded.
  return provider === "epay" ? "nezha_wxpay" : "nezha_wxpay";
}

export function getStorefrontPaymentMethods({
  isNezhaEnabled,
  stripeLabel,
  defaultProviders = { alipay: "nezha", wxpay: "nezha" },
}: {
  isNezhaEnabled: boolean;
  stripeLabel: string;
  defaultProviders?: DefaultPaymentProviders;
}): StorefrontPaymentOption[] {
  const methods: StorefrontPaymentOption[] = [];

  if (isNezhaEnabled) {
    methods.push(
      {
        value: getDefaultAlipayMethod(defaultProviders.alipay),
        label: "支付宝支付",
        description:
          "支持支付宝支付。支付完成后系统会自动确认付款状态，订单进入待发货状态。",
      },
      {
        value: getDefaultWxpayMethod(defaultProviders.wxpay),
        label: "微信支付",
        description:
          "支持微信支付。支付完成后系统会自动确认付款状态，订单进入待发货状态。",
      },
    );
  }

  methods.push({
    value: "gateway_reserved",
    label: stripeLabel || "Stripe Checkout",
    description:
      "支持 Stripe Checkout 在线支付。支付完成后系统会自动确认付款状态，订单进入待发货状态。",
  });

  return methods;
}
