import crypto from "crypto";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/payment-gateway";

export type NezhaPaymentCode = "nezha_alipay" | "nezha_wxpay";
export type NezhaPaymentType = "alipay" | "wxpay";

export type NezhaPayConfig = {
  enabled: boolean;
  gateway: string;
  pid: string;
  privateKey: string;
  platformPublicKey: string;
  returnUrl: string;
  notifyUrl: string;
  defaultAlipayProvider: string;
  defaultWxpayProvider: string;
};

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

type NezhaQueryResult = {
  ok: boolean;
  paid: boolean;
  message: string;
};

type PaymentSettingsMap = Partial<Record<string, string>>;

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

export const nezhaSettingKeys = [
  "nezha_pay_enabled",
  "nezha_pay_gateway",
  "nezha_pay_pid",
  "nezha_pay_private_key",
  "nezha_pay_platform_public_key",
  "nezha_pay_return_url",
  "nezha_pay_notify_url",
  "default_alipay_provider",
  "default_wxpay_provider",
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
  return value === "true";
}

export async function getPaymentSettingMap() {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [...nezhaSettingKeys],
      },
    },
  });

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getNezhaPayConfig(): Promise<NezhaPayConfig> {
  const settings = await getPaymentSettingMap();

  return {
    enabled: parseEnabled(
      settingOrEnv(settings, "nezha_pay_enabled", process.env.NEZHA_PAY_ENABLED, "false"),
    ),
    gateway: settingOrEnv(
      settings,
      "nezha_pay_gateway",
      process.env.NEZHA_PAY_GATEWAY,
      "https://nzzf.org",
    ),
    pid: settingOrEnv(settings, "nezha_pay_pid", process.env.NEZHA_PAY_PID),
    privateKey: settingOrEnv(
      settings,
      "nezha_pay_private_key",
      process.env.NEZHA_PAY_PRIVATE_KEY,
    ),
    platformPublicKey: settingOrEnv(
      settings,
      "nezha_pay_platform_public_key",
      process.env.NEZHA_PAY_PLATFORM_PUBLIC_KEY,
    ),
    returnUrl: settingOrEnv(
      settings,
      "nezha_pay_return_url",
      process.env.NEZHA_PAY_RETURN_URL,
    ),
    notifyUrl: settingOrEnv(
      settings,
      "nezha_pay_notify_url",
      process.env.NEZHA_PAY_NOTIFY_URL,
    ),
    defaultAlipayProvider: settingOrEnv(
      settings,
      "default_alipay_provider",
      process.env.DEFAULT_ALIPAY_PROVIDER,
      "nezha",
    ),
    defaultWxpayProvider: settingOrEnv(
      settings,
      "default_wxpay_provider",
      process.env.DEFAULT_WXPAY_PROVIDER,
      "nezha",
    ),
  };
}

export function isNezhaPaymentCode(value: string): value is NezhaPaymentCode {
  return value === "nezha_alipay" || value === "nezha_wxpay";
}

export function getNezhaPaymentType(method: NezhaPaymentCode) {
  return nezhaPaymentTypeByMethod[method];
}

export function getNezhaConfigIssues(config: NezhaPayConfig) {
  const issues: string[] = [];

  if (!config.enabled) {
    issues.push("NEZHA_PAY_ENABLED 必须设置为 true");
  }
  if (!config.gateway) {
    issues.push("NEZHA_PAY_GATEWAY 未配置");
  }
  if (!config.pid) {
    issues.push("NEZHA_PAY_PID 未配置");
  }
  if (!config.privateKey) {
    issues.push("NEZHA_PAY_PRIVATE_KEY 未配置");
  }
  if (!config.platformPublicKey) {
    issues.push("NEZHA_PAY_PLATFORM_PUBLIC_KEY 未配置");
  }
  if (!config.returnUrl) {
    issues.push("NEZHA_PAY_RETURN_URL 未配置");
  }
  if (!config.notifyUrl) {
    issues.push("NEZHA_PAY_NOTIFY_URL 未配置");
  }

  return issues;
}

export function getNezhaDisplayDiagnostics(config: NezhaPayConfig) {
  return {
    nezhaEnabled: config.enabled,
    hasPid: Boolean(config.pid),
    hasPrivateKey: Boolean(config.privateKey),
    hasPlatformPublicKey: Boolean(config.platformPublicKey),
    hasReturnUrl: Boolean(config.returnUrl),
    hasNotifyUrl: Boolean(config.notifyUrl),
    privateKeyParsed: config.privateKey ? canParsePrivateKey(config.privateKey) : false,
  };
}

export async function isNezhaPaymentEnabled() {
  const config = await getNezhaPayConfig();
  const diagnostics = getNezhaDisplayDiagnostics(config);

  console.info("[nezha] storefront display diagnostics", diagnostics);

  return (
    diagnostics.nezhaEnabled &&
    diagnostics.hasPid &&
    diagnostics.hasPrivateKey &&
    diagnostics.hasPlatformPublicKey
  );
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

function createNezhaPrivateKey(config: NezhaPayConfig) {
  try {
    return crypto.createPrivateKey(normalizePemKey(config.privateKey));
  } catch {
    throw new NezhaKeyFormatError(
      "哪吒支付商户私钥格式错误，请检查 NEZHA_PAY_PRIVATE_KEY",
    );
  }
}

function createNezhaPublicKey(config: NezhaPayConfig) {
  try {
    return crypto.createPublicKey(normalizePemKey(config.platformPublicKey));
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

function getSafeSignDebugPayload(
  params: Record<string, unknown>,
  config: NezhaPayConfig,
) {
  return {
    privateKeyParsed: canParsePrivateKey(config.privateKey),
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

export function signNezhaParams(
  params: Record<string, unknown>,
  config: NezhaPayConfig,
) {
  const signContent = buildSignContent(params);
  const signer = crypto.createSign("RSA-SHA256");

  signer.update(signContent);
  signer.end();

  return signer.sign(createNezhaPrivateKey(config), "base64");
}

export function verifyNezhaParams(
  params: Record<string, unknown>,
  config: NezhaPayConfig,
) {
  const sign =
    typeof params.sign === "string" ? params.sign : String(params.sign || "");

  if (!sign || !config.platformPublicKey) {
    return false;
  }

  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(buildSignContent(params));
    verifier.end();

    return verifier.verify(createNezhaPublicKey(config), sign, "base64");
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

function getCreateUrl(config: NezhaPayConfig) {
  return new URL("/api/pay/create", config.gateway).toString();
}

function getQueryUrl(config: NezhaPayConfig) {
  return new URL("/api/pay/query", config.gateway).toString();
}

function getNezhaReturnUrl(orderNo: string, config: NezhaPayConfig) {
  const baseUrl = config.returnUrl || getAbsoluteUrl(`/payment/result`);
  const url = new URL(baseUrl);

  url.searchParams.set("orderNo", orderNo);

  return url.toString();
}

export async function createNezhaPayment(input: NezhaCreateInput) {
  const config = await getNezhaPayConfig();
  const issues = getNezhaConfigIssues(config);
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
    pid: config.pid,
    method: "jump",
    device: "pc",
    type: channel,
    out_trade_no: input.orderNo,
    notify_url: config.notifyUrl,
    return_url: getNezhaReturnUrl(input.orderNo, config),
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
      sign: signNezhaParams(params, config),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "哪吒支付请求签名失败";
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: getSafeSignDebugPayload(params, config),
      success: false,
      message:
        error instanceof NezhaKeyFormatError
          ? error.message
          : "哪吒支付请求签名失败",
    });
    console.error("[nezha] create request signing failed", {
      orderNo: input.orderNo,
      privateKeyParsed: canParsePrivateKey(config.privateKey),
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
    const response = await fetch(getCreateUrl(config), {
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

  const verified = verifyNezhaParams(responsePayload, config);
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

  if (code === "0" && (payType === "jump" || payType === "qrcode") && payInfo) {
    await writePaymentLog({
      orderId: input.orderId,
      orderNo: input.orderNo,
      channel,
      event: "create",
      requestPayload: params,
      responsePayload,
      success: true,
      message:
        payType === "qrcode"
          ? "哪吒支付二维码创建成功"
          : "哪吒支付跳转创建成功",
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

function isNezhaPaidPayload(payload: Record<string, unknown>) {
  const status = String(payload.status ?? payload.trade_status ?? "");

  return status === "1" || status === "TRADE_SUCCESS";
}

function getQueryMoney(payload: Record<string, unknown>) {
  return String(payload.money ?? payload.amount ?? "");
}

function getQueryChannel(payload: Record<string, unknown>, fallback: string) {
  return String(payload.type ?? payload.channel ?? fallback);
}

function getPaymentMethodFromQuery(
  payload: Record<string, unknown>,
  existingMethod: string,
) {
  if (isNezhaPaymentCode(existingMethod)) {
    return existingMethod as PaymentMethod;
  }

  return getQueryChannel(payload, "") === "wxpay"
    ? PaymentMethod.nezha_wxpay
    : PaymentMethod.nezha_alipay;
}

export async function queryNezhaPaymentAndSync(
  orderNo: string,
): Promise<NezhaQueryResult> {
  const config = await getNezhaPayConfig();
  const issues = getNezhaConfigIssues(config);
  if (issues.length > 0) {
    await writePaymentLog({
      orderNo,
      event: "query",
      success: false,
      message: `哪吒支付配置不完整：${issues.join("；")}`,
    });
    return {
      ok: false,
      paid: false,
      message: "哪吒支付配置不完整，请联系管理员检查配置",
    };
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      paymentRecords: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    await writePaymentLog({
      orderNo,
      event: "query",
      success: false,
      message: "本地订单不存在",
    });
    return { ok: false, paid: false, message: "订单不存在" };
  }

  if (!isNezhaPaymentCode(order.paymentMethod)) {
    return {
      ok: false,
      paid: false,
      message: "当前订单不是支付宝或微信支付订单",
    };
  }

  if (order.paymentStatus === PaymentStatus.paid) {
    return {
      ok: true,
      paid: true,
      message: "订单已付款，等待后台发货",
    };
  }

  const channel = getNezhaPaymentType(order.paymentMethod);
  const params = {
    pid: config.pid,
    out_trade_no: order.orderNo,
    timestamp: String(Math.floor(Date.now() / 1000)),
    sign_type: "RSA",
  };
  let signedParams: Record<string, string>;

  try {
    signedParams = {
      ...params,
      sign: signNezhaParams(params, config),
    };
  } catch (error) {
    const message =
      error instanceof NezhaKeyFormatError
        ? error.message
        : "哪吒支付查单签名失败";
    await writePaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "query",
      requestPayload: getSafeSignDebugPayload(params, config),
      success: false,
      message,
    });
    return { ok: false, paid: false, message };
  }

  let responsePayload: Record<string, unknown>;

  try {
    const response = await fetch(getQueryUrl(config), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(signedParams).toString(),
    });
    responsePayload = (await response.json()) as Record<string, unknown>;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "哪吒支付主动查单请求失败";
    await writePaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "query",
      requestPayload: params,
      success: false,
      message,
    });
    return {
      ok: false,
      paid: false,
      message: "主动查询支付状态失败，请稍后重试",
    };
  }

  if (!verifyNezhaParams(responsePayload, config)) {
    await writePaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "query",
      requestPayload: params,
      responsePayload,
      success: false,
      message: "哪吒支付查单响应验签失败",
    });
    return {
      ok: false,
      paid: false,
      message: "支付状态响应验签失败，请稍后重试或联系客服",
    };
  }

  if (!isNezhaPaidPayload(responsePayload)) {
    await writePaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "query",
      requestPayload: params,
      responsePayload,
      success: true,
      message: "主动查单暂未检测到付款",
    });
    return {
      ok: true,
      paid: false,
      message: "暂未检测到付款，请稍后刷新或通过订单查询查看",
    };
  }

  const queryMoney = getQueryMoney(responsePayload);
  if (moneyToCents(queryMoney) !== moneyToCents(order.totalAmount)) {
    await writePaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "query",
      requestPayload: params,
      responsePayload,
      success: false,
      message: `主动查单金额不一致：query=${queryMoney}, order=${order.totalAmount.toString()}`,
    });
    return {
      ok: false,
      paid: false,
      message: "支付金额与订单金额不一致，请联系客服处理",
    };
  }

  const paymentMethod = getPaymentMethodFromQuery(
    responsePayload,
    order.paymentMethod,
  );
  const transactionId = String(
    responsePayload.trade_no || responsePayload.api_trade_no || "",
  );
  const note = JSON.stringify({
    provider: "nezha",
    channel: getQueryChannel(responsePayload, channel),
    trade_no: responsePayload.trade_no || "",
    api_trade_no: responsePayload.api_trade_no || "",
    type: responsePayload.type || "",
    buyer: responsePayload.buyer || "",
    endtime: responsePayload.endtime || "",
    raw: responsePayload,
    source: "query",
  });

  await prisma.$transaction(async (tx) => {
    const latestOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        paymentStatus: true,
        orderStatus: true,
        paidAt: true,
      },
    });

    if (!latestOrder || latestOrder.paymentStatus === PaymentStatus.paid) {
      return;
    }

    const existingRecord =
      order.paymentRecords.find((record) => {
        return (
          record.transactionId === responsePayload.trade_no ||
          record.transactionId === responsePayload.api_trade_no
        );
      }) || order.paymentRecords[0];

    const paymentRecordData = {
      method: paymentMethod,
      amount: order.totalAmount,
      status: PaymentStatus.paid,
      transactionId,
      note,
    };

    if (existingRecord) {
      await tx.paymentRecord.update({
        where: { id: existingRecord.id },
        data: paymentRecordData,
      });
    } else {
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          ...paymentRecordData,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentMethod,
        paymentStatus: PaymentStatus.paid,
        ...(latestOrder.orderStatus === "completed"
          ? {}
          : { orderStatus: "paid" }),
        paidAt: latestOrder.paidAt || new Date(),
      },
    });
  });

  await writePaymentLog({
    orderId: order.id,
    orderNo: order.orderNo,
    channel: getQueryChannel(responsePayload, channel),
    event: "query",
    requestPayload: params,
    responsePayload,
    success: true,
    message: "主动查单确认付款成功",
  });

  return {
    ok: true,
    paid: true,
    message: "支付成功，订单已付款，等待后台发货",
  };
}
