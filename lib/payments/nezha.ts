import crypto from "crypto";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/payment-gateway";

export type NezhaPaymentCode = "nezha_alipay" | "nezha_wxpay";
export type NezhaPaymentType = "alipay" | "wxpay";

type NezhaCreateInput = {
  orderId: string;
  orderNo: string;
  productName: string;
  amount: Prisma.Decimal;
  clientIp: string | null;
  paymentMethod: NezhaPaymentCode;
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

const nezhaPaymentTypeByMethod: Record<NezhaPaymentCode, NezhaPaymentType> = {
  nezha_alipay: "alipay",
  nezha_wxpay: "wxpay",
};

export const nezhaPaymentLabels: Record<NezhaPaymentCode, string> = {
  nezha_alipay: "哪吒支付宝",
  nezha_wxpay: "哪吒微信支付",
};

export const nezhaPaymentMethods = Object.keys(
  nezhaPaymentTypeByMethod,
) as NezhaPaymentCode[];

export const nezhaPayConfig = {
  enabled: process.env.NEZHA_PAY_ENABLED === "true",
  gateway: process.env.NEZHA_PAY_GATEWAY || "https://nzzf.org",
  pid: process.env.NEZHA_PAY_PID || "",
  privateKey: process.env.NEZHA_PAY_PRIVATE_KEY || "",
  platformPublicKey: process.env.NEZHA_PAY_PLATFORM_PUBLIC_KEY || "",
  returnUrl: process.env.NEZHA_PAY_RETURN_URL || "",
  notifyUrl: process.env.NEZHA_PAY_NOTIFY_URL || "",
};

export function isNezhaPaymentCode(value: string): value is NezhaPaymentCode {
  return value === "nezha_alipay" || value === "nezha_wxpay";
}

export function getNezhaPaymentType(method: NezhaPaymentCode) {
  return nezhaPaymentTypeByMethod[method];
}

export function getNezhaConfigIssues() {
  const issues: string[] = [];

  if (!nezhaPayConfig.enabled) {
    issues.push("NEZHA_PAY_ENABLED 必须设置为 true");
  }
  if (!nezhaPayConfig.gateway) {
    issues.push("NEZHA_PAY_GATEWAY 未配置");
  }
  if (!nezhaPayConfig.pid) {
    issues.push("NEZHA_PAY_PID 未配置");
  }
  if (!nezhaPayConfig.privateKey) {
    issues.push("NEZHA_PAY_PRIVATE_KEY 未配置");
  }
  if (!nezhaPayConfig.platformPublicKey) {
    issues.push("NEZHA_PAY_PLATFORM_PUBLIC_KEY 未配置");
  }
  if (!nezhaPayConfig.returnUrl) {
    issues.push("NEZHA_PAY_RETURN_URL 未配置");
  }
  if (!nezhaPayConfig.notifyUrl) {
    issues.push("NEZHA_PAY_NOTIFY_URL 未配置");
  }
  if (nezhaPayConfig.privateKey && !canParsePrivateKey(nezhaPayConfig.privateKey)) {
    issues.push("NEZHA_PAY_PRIVATE_KEY 格式错误");
  }
  if (
    nezhaPayConfig.platformPublicKey &&
    !canParsePublicKey(nezhaPayConfig.platformPublicKey)
  ) {
    issues.push("NEZHA_PAY_PLATFORM_PUBLIC_KEY 格式错误");
  }

  return issues;
}

export function isNezhaPaymentEnabled() {
  return nezhaPayConfig.enabled && getNezhaConfigIssues().length === 0;
}

export function normalizePemKey(value: string) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}

class NezhaKeyFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NezhaKeyFormatError";
  }
}

function createNezhaPrivateKey() {
  try {
    return crypto.createPrivateKey(normalizePemKey(nezhaPayConfig.privateKey));
  } catch {
    throw new NezhaKeyFormatError(
      "哪吒支付商户私钥格式错误，请检查 NEZHA_PAY_PRIVATE_KEY",
    );
  }
}

function createNezhaPublicKey() {
  try {
    return crypto.createPublicKey(
      normalizePemKey(nezhaPayConfig.platformPublicKey),
    );
  } catch {
    throw new NezhaKeyFormatError(
      "哪吒支付平台公钥格式错误，请检查 NEZHA_PAY_PLATFORM_PUBLIC_KEY",
    );
  }
}

function canParsePrivateKey(value: string) {
  try {
    crypto.createPrivateKey(normalizePemKey(value));
    return true;
  } catch {
    return false;
  }
}

function canParsePublicKey(value: string) {
  try {
    crypto.createPublicKey(normalizePemKey(value));
    return true;
  } catch {
    return false;
  }
}

function getSafeSignDebugPayload(params: Record<string, unknown>) {
  return {
    privateKeyParsed: canParsePrivateKey(nezhaPayConfig.privateKey),
    signContent: buildSignContent(params),
    signParamKeys: getSignEntries(params).map(([key]) => key),
  };
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

export function buildSignContent(params: Record<string, unknown>) {
  return getSignEntries(params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
}

export function signNezhaParams(params: Record<string, unknown>) {
  const signContent = buildSignContent(params);
  const signer = crypto.createSign("RSA-SHA256");

  signer.update(signContent);
  signer.end();

  return signer.sign(createNezhaPrivateKey(), "base64");
}

export function verifyNezhaParams(params: Record<string, unknown>) {
  const sign =
    typeof params.sign === "string" ? params.sign : String(params.sign || "");

  if (!sign || !nezhaPayConfig.platformPublicKey) {
    return false;
  }

  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(buildSignContent(params));
    verifier.end();

    return verifier.verify(createNezhaPublicKey(), sign, "base64");
  } catch (error) {
    console.error("[nezha] signature verification failed", {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

function safeTruncateByBytes(value: string, maxBytes: number) {
  let result = "";
  let bytes = 0;

  for (const char of value) {
    const charBytes = Buffer.byteLength(char);
    if (bytes + charBytes > maxBytes) {
      break;
    }
    result += char;
    bytes += charBytes;
  }

  return result || "虚拟商品订单";
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

export async function writePaymentLog(input: PaymentLogInput) {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId: input.orderId || null,
        orderNo: input.orderNo || null,
        provider: "nezha",
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
    console.error("[nezha] failed to write payment log", {
      event: input.event,
      orderNo: input.orderNo,
      error,
    });
  }
}

function getCreateUrl() {
  return new URL("/api/pay/create", nezhaPayConfig.gateway).toString();
}

export async function createNezhaPayment(input: NezhaCreateInput) {
  const issues = getNezhaConfigIssues();
  const channel = getNezhaPaymentType(input.paymentMethod);

  if (issues.length > 0) {
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      success: false,
      message: `哪吒支付配置不完整：${issues.join("；")}`,
    });
    return {
      ok: false,
      message: `哪吒支付配置不完整：${issues.join("；")}`,
    };
  }

  const params = {
    pid: nezhaPayConfig.pid,
    method: "jump",
    device: "pc",
    type: channel,
    out_trade_no: input.orderNo,
    notify_url: nezhaPayConfig.notifyUrl,
    return_url:
      nezhaPayConfig.returnUrl ||
      getAbsoluteUrl(`/payment/result?orderNo=${input.orderNo}`),
    name: safeTruncateByBytes(input.productName, 127),
    money: decimalToYuan(input.amount),
    clientip: input.clientIp || "127.0.0.1",
    timestamp: String(Math.floor(Date.now() / 1000)),
    sign_type: "RSA",
  };
  let signedParams: Record<string, string>;

  try {
    signedParams = {
      ...params,
      sign: signNezhaParams(params),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "哪吒支付请求签名失败";
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: getSafeSignDebugPayload(params),
      success: false,
      message:
        error instanceof NezhaKeyFormatError
          ? error.message
          : "哪吒支付请求签名失败",
    });
    console.error("[nezha] create request signing failed", {
      orderNo: input.orderNo,
      privateKeyParsed: canParsePrivateKey(nezhaPayConfig.privateKey),
      signParamKeys: getSignEntries(params).map(([key]) => key),
      error: message,
    });
    return {
      ok: false,
      message:
        error instanceof NezhaKeyFormatError
          ? error.message
          : "哪吒支付签名失败，请检查商户私钥配置",
    };
  }

  let responsePayload: Record<string, unknown>;

  try {
    const response = await fetch(getCreateUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(signedParams).toString(),
    });
    responsePayload = (await response.json()) as Record<string, unknown>;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "哪吒支付统一下单请求失败";
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: params,
      success: false,
      message,
    });
    return { ok: false, message: "哪吒支付创建失败，请稍后重试" };
  }

  const verified = verifyNezhaParams(responsePayload);
  if (!verified) {
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: params,
      responsePayload,
      success: false,
      message: "哪吒支付创建响应验签失败",
    });
    return { ok: false, message: "哪吒支付响应验签失败，请联系客服" };
  }

  const code = String(responsePayload.code ?? "");
  const payType = String(responsePayload.pay_type ?? "");
  const payInfo = String(responsePayload.pay_info ?? "");

  if (code === "0" && payType === "jump" && payInfo) {
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: params,
      responsePayload,
      success: true,
      message: "哪吒支付跳转创建成功",
    });

    await prisma.paymentRecord.create({
      data: {
        orderId: input.orderId,
        method: input.paymentMethod as PaymentMethod,
        amount: input.amount,
        status: PaymentStatus.pending,
        transactionId: String(responsePayload.trade_no || ""),
        note: JSON.stringify({
          provider: "nezha",
          channel,
          event: "create",
        }),
      },
    });

    return { ok: true, checkoutUrl: payInfo };
  }

  if (code === "0") {
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: params,
      responsePayload,
      success: false,
      message: `哪吒支付返回类型暂不支持：${payType}`,
    });
    return {
      ok: false,
      message: "当前返回类型暂不支持，请联系客服或选择其他支付方式",
    };
  }

  const message =
    String(responsePayload.msg || responsePayload.message || "") ||
    "哪吒支付创建失败";
  await writePaymentLog({
    orderId: input.orderId,
    orderNo: input.orderNo,
    channel,
    event: "create",
    requestPayload: params,
    responsePayload,
    success: false,
    message,
  });

  return { ok: false, message: `哪吒支付创建失败：${message}` };
}
