import crypto from "crypto";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/payment-gateway";

export type EpayPaymentCode = "epay_alipay" | "epay_wxpay";
export type EpayPaymentType = "alipay" | "wxpay";

export type EpayConfig = {
  enabled: boolean;
  gateway: string;
  pid: string;
  key: string;
  device: string;
  signType: string;
  notifyUrl: string;
  returnUrl: string;
};

type EpayCreateInput = {
  orderId: string;
  orderNo: string;
  productName: string;
  amount: Prisma.Decimal;
  paymentMethod: EpayPaymentCode;
};

type PaymentLogInput = {
  orderId?: string | null;
  orderNo?: string | null;
  channel?: string | null;
  event: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  success: boolean;
  message?: string | null;
};

type PaymentSettingsMap = Partial<Record<string, string>>;

const epayPaymentTypeByMethod: Record<EpayPaymentCode, EpayPaymentType> = {
  epay_alipay: "alipay",
  epay_wxpay: "wxpay",
};

export const epayPaymentMethods = Object.keys(
  epayPaymentTypeByMethod,
) as EpayPaymentCode[];

export const epaySettingKeys = [
  "epay_enabled",
  "epay_gateway",
  "epay_pid",
  "epay_key",
  "epay_device",
  "epay_sign_type",
  "epay_notify_url",
  "epay_return_url",
] as const;

function envOrDefault(value: string | undefined, fallback = "") {
  return value && value.trim() ? value.trim() : fallback;
}

function settingOrEnv(
  settings: PaymentSettingsMap,
  settingKey: string,
  envValue: string | undefined,
  fallback = "",
) {
  const settingValue = settings[settingKey];

  if (settingValue !== undefined && settingValue.trim() !== "") {
    return settingValue.trim();
  }

  return envOrDefault(envValue, fallback);
}

function parseEnabled(value: string) {
  return value.trim().toLowerCase() === "true";
}

async function getEpaySettingMap() {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [...epaySettingKeys],
      },
    },
  });

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getEpayConfig(): Promise<EpayConfig> {
  const settings = await getEpaySettingMap();

  return {
    enabled: parseEnabled(
      settingOrEnv(settings, "epay_enabled", process.env.EPAY_ENABLED, "false"),
    ),
    gateway: settingOrEnv(settings, "epay_gateway", process.env.EPAY_GATEWAY),
    pid: settingOrEnv(settings, "epay_pid", process.env.EPAY_PID),
    key: settingOrEnv(settings, "epay_key", process.env.EPAY_KEY),
    device: settingOrEnv(
      settings,
      "epay_device",
      process.env.EPAY_DEVICE,
      "pc",
    ),
    signType: settingOrEnv(
      settings,
      "epay_sign_type",
      process.env.EPAY_SIGN_TYPE,
      "MD5",
    ),
    notifyUrl: settingOrEnv(
      settings,
      "epay_notify_url",
      process.env.EPAY_NOTIFY_URL,
    ),
    returnUrl: settingOrEnv(
      settings,
      "epay_return_url",
      process.env.EPAY_RETURN_URL,
    ),
  };
}

export function isEpayPaymentCode(value: string): value is EpayPaymentCode {
  return value === "epay_alipay" || value === "epay_wxpay";
}

export function getEpayPaymentType(method: EpayPaymentCode) {
  return epayPaymentTypeByMethod[method];
}

export function getEpayConfigIssues(config: EpayConfig) {
  const issues: string[] = [];

  if (!config.enabled) {
    issues.push("EPAY_ENABLED 必须设置为 true");
  }
  if (!config.gateway) {
    issues.push("EPAY_GATEWAY 未配置");
  } else {
    try {
      const gatewayUrl = new URL(config.gateway);
      if (!["http:", "https:"].includes(gatewayUrl.protocol)) {
        issues.push("EPAY_GATEWAY 必须是完整 http 或 https URL");
      }
    } catch {
      issues.push("EPAY_GATEWAY 必须是完整 URL");
    }
  }
  if (!config.pid) {
    issues.push("EPAY_PID 未配置");
  }
  if (!config.key) {
    issues.push("EPAY_KEY 未配置");
  }
  if (!config.notifyUrl) {
    issues.push("EPAY_NOTIFY_URL 未配置");
  }
  if (!config.returnUrl) {
    issues.push("EPAY_RETURN_URL 未配置");
  }

  return issues;
}

export function getEpayDisplayDiagnostics(config: EpayConfig) {
  return {
    epayEnabled: config.enabled,
    hasGateway: Boolean(config.gateway),
    hasPid: Boolean(config.pid),
    hasKey: Boolean(config.key),
    hasNotifyUrl: Boolean(config.notifyUrl),
    hasReturnUrl: Boolean(config.returnUrl),
  };
}

export async function isEpayPaymentEnabled() {
  const config = await getEpayConfig();
  const diagnostics = getEpayDisplayDiagnostics(config);

  console.info("[epay] storefront display diagnostics", diagnostics);

  return (
    diagnostics.epayEnabled &&
    diagnostics.hasGateway &&
    diagnostics.hasPid &&
    diagnostics.hasKey &&
    diagnostics.hasNotifyUrl &&
    diagnostics.hasReturnUrl
  );
}

function getSignEntries(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([key, value]) => {
      if (key === "sign" || key === "sign_type") {
        return false;
      }
      return value !== undefined && value !== null && String(value) !== "";
    })
    .sort(([left], [right]) => {
      if (left < right) {
        return -1;
      }
      if (left > right) {
        return 1;
      }
      return 0;
    });
}

export function buildEpaySignContent(params: Record<string, unknown>) {
  return getSignEntries(params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
}

export function buildEpaySign(params: Record<string, unknown>, key: string) {
  const signContent = `${buildEpaySignContent(params)}${key}`;

  return crypto.createHash("md5").update(signContent).digest("hex").toLowerCase();
}

export function verifyEpaySign(params: Record<string, unknown>, key: string) {
  const sign =
    typeof params.sign === "string" ? params.sign.toLowerCase() : "";

  if (!sign || !key) {
    return false;
  }

  return buildEpaySign(params, key) === sign;
}

function safeTruncate(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function decimalToYuan(amount: Prisma.Decimal | number) {
  const value = amount instanceof Prisma.Decimal ? amount.toNumber() : amount;
  return value.toFixed(2);
}

export function moneyToCents(value: string | number | Prisma.Decimal) {
  if (value instanceof Prisma.Decimal) {
    return value.mul(100).toDecimalPlaces(0).toNumber();
  }

  return Math.round(Number(value) * 100);
}

export async function writeEpayPaymentLog(input: PaymentLogInput) {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId: input.orderId || null,
        orderNo: input.orderNo || null,
        provider: "epay",
        channel: input.channel || null,
        event: input.event,
        requestPayload:
          input.requestPayload === undefined
            ? Prisma.JsonNull
            : (input.requestPayload as Prisma.InputJsonValue),
        responsePayload:
          input.responsePayload === undefined
            ? Prisma.JsonNull
            : (input.responsePayload as Prisma.InputJsonValue),
        success: input.success,
        message: input.message || null,
      },
    });
  } catch (error) {
    console.error("[epay] failed to write payment log", {
      event: input.event,
      orderNo: input.orderNo,
      error,
    });
  }
}

function getSubmitUrl(config: EpayConfig) {
  return new URL("/submit.php", config.gateway).toString();
}

function getEpayReturnUrl(orderNo: string, config: EpayConfig) {
  const baseUrl = config.returnUrl || getAbsoluteUrl("/payment/result");
  const url = new URL(baseUrl);

  url.searchParams.set("orderNo", orderNo);

  return url.toString();
}

export async function createEpayPayment(input: EpayCreateInput) {
  const config = await getEpayConfig();
  const issues = getEpayConfigIssues(config);
  const channel = getEpayPaymentType(input.paymentMethod);

  if (issues.length > 0) {
    await writeEpayPaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      success: false,
      message: `epay 配置不完整：${issues.join("；")}`,
    });
    return {
      ok: false,
      message: `epay 配置不完整：${issues.join("；")}`,
    };
  }

  const params = {
    pid: config.pid,
    device: config.device || "pc",
    type: channel,
    out_trade_no: input.orderNo,
    notify_url: config.notifyUrl,
    return_url: getEpayReturnUrl(input.orderNo, config),
    name: safeTruncate(input.productName, 120),
    money: decimalToYuan(input.amount),
    sign_type: config.signType || "MD5",
  };
  const signedParams = {
    ...params,
    sign: buildEpaySign(params, config.key),
  };
  const checkoutUrl = `${getSubmitUrl(config)}?${new URLSearchParams(
    signedParams,
  ).toString()}`;

  await writeEpayPaymentLog({
    orderId: input.orderId,
    orderNo: input.orderNo,
    channel,
    event: "create",
    requestPayload: params,
    responsePayload: {
      pay_type: "jump",
      pay_info: checkoutUrl,
    },
    success: true,
    message: "epay 跳转支付链接创建成功",
  });

  await prisma.paymentRecord.create({
    data: {
      orderId: input.orderId,
      method: input.paymentMethod as PaymentMethod,
      amount: input.amount,
      status: PaymentStatus.pending,
      transactionId: "",
      note: JSON.stringify({
        provider: "epay",
        channel,
        event: "create",
      }),
    },
  });

  return { ok: true, checkoutUrl };
}

export function verifyEpayNotify(
  payload: Record<string, unknown>,
  config: EpayConfig,
) {
  return verifyEpaySign(payload, config.key);
}
