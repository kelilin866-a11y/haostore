import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

type SupplierOrder = {
  id: string;
  orderNo: string;
  contact: string;
  totalAmount: Prisma.Decimal;
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
  deliveredAt: Date | null;
  items: Array<{
    id: string;
    quantity: number;
    productTitleSnapshot: string;
    variantNameSnapshot: string;
    variant: {
      id: string;
      sku: string;
    };
    product: {
      id: string;
      title: string;
      deliveryMode: string;
      supplierApiBaseUrl: string | null;
      supplierAppId: string | null;
      supplierAppKey: string | null;
      supplierSharedCode: string | null;
      supplierRace: string | null;
      supplierSkuJson: Prisma.JsonValue | null;
      supplierCardId: string | null;
      supplierDevice: string | null;
    };
  }>;
};

type SupplierResult =
  | {
      ok: true;
      message: string;
      deliveryContent: string;
      supplierTradeNo: string;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

function getSignEntries(params: Record<string, unknown>) {
  return Object.entries(params)
    .filter(([key, value]) => {
      if (key === "sign") {
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

function build8877Sign(params: Record<string, unknown>, appKey: string) {
  const query = new URLSearchParams(
    getSignEntries(params).map(([key, value]) => [key, String(value)]),
  ).toString();
  const decodedQuery = decodeURIComponent(query);

  return crypto
    .createHash("md5")
    .update(`${decodedQuery}&key=${appKey}`)
    .digest("hex")
    .toLowerCase();
}

function getTradeUrl(baseUrl: string) {
  return new URL("/shared/commodity/trade", baseUrl).toString();
}

function getSupplierSku(
  skuJson: Prisma.JsonValue | null,
  item: SupplierOrder["items"][number],
) {
  if (typeof skuJson === "string" && skuJson.trim()) {
    return skuJson.trim();
  }

  if (skuJson && typeof skuJson === "object" && !Array.isArray(skuJson)) {
    const map = skuJson as Record<string, unknown>;
    const candidates = [
      map[item.variant.id],
      map[item.variant.sku],
      map[item.variantNameSnapshot],
      map.default,
    ];
    const match = candidates.find(
      (value) => typeof value === "string" && value.trim(),
    );

    if (typeof match === "string") {
      return match.trim();
    }
  }

  return item.variant.sku;
}

async function writeSupplierLog({
  order,
  requestPayload,
  responsePayload,
  success,
  message,
}: {
  order: SupplierOrder;
  requestPayload?: unknown;
  responsePayload?: unknown;
  success: boolean;
  message: string;
}) {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        provider: "supplier_8877",
        channel: "auto_delivery",
        event: success ? "delivery" : "error",
        requestPayload:
          requestPayload === undefined
            ? Prisma.JsonNull
            : (requestPayload as Prisma.InputJsonValue),
        responsePayload:
          responsePayload === undefined
            ? Prisma.JsonNull
            : (responsePayload as Prisma.InputJsonValue),
        success,
        message,
      },
    });
  } catch (error) {
    console.error("[supplier-8877] failed to write delivery log", {
      orderNo: order.orderNo,
      error,
    });
  }
}

export async function deliverSupplier8877Order(
  order: SupplierOrder,
): Promise<SupplierResult> {
  if (order.items.length !== 1) {
    return {
      ok: false,
      message: "供货商 API 自动发货 v1 仅支持单商品订单",
      status: 400,
    };
  }

  const item = order.items[0];
  const product = item.product;
  const missingFields = [
    ["supplierApiBaseUrl", product.supplierApiBaseUrl],
    ["supplierAppId", product.supplierAppId],
    ["supplierAppKey", product.supplierAppKey],
    ["supplierSharedCode", product.supplierSharedCode],
  ].filter(([, value]) => !value);

  if (missingFields.length > 0) {
    return {
      ok: false,
      message: `供货商配置不完整：${missingFields.map(([key]) => key).join("、")}`,
      status: 400,
    };
  }

  const params = {
    app_id: product.supplierAppId || "",
    shared_code: product.supplierSharedCode || "",
    num: String(item.quantity),
    request_no: order.orderNo,
    contact: order.contact,
    race: product.supplierRace || "",
    sku: getSupplierSku(product.supplierSkuJson, item),
    card_id: product.supplierCardId || "",
    password: "",
    coupon: "",
    device: product.supplierDevice || "pc",
  };
  const signedParams = {
    ...params,
    sign: build8877Sign(params, product.supplierAppKey || ""),
  };
  let responsePayload: Record<string, unknown>;

  try {
    const response = await fetch(getTradeUrl(product.supplierApiBaseUrl || ""), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(signedParams).toString(),
    });
    responsePayload = (await response.json()) as Record<string, unknown>;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "供货商 API 请求失败";
    await writeSupplierLog({
      order,
      requestPayload: params,
      success: false,
      message,
    });
    return { ok: false, message };
  }

  const code = Number(responsePayload.code);
  const data =
    responsePayload.data &&
    typeof responsePayload.data === "object" &&
    !Array.isArray(responsePayload.data)
      ? (responsePayload.data as Record<string, unknown>)
      : {};
  const secret = typeof data.secret === "string" ? data.secret.trim() : "";
  const supplierTradeNo =
    typeof data.tradeNo === "string" ? data.tradeNo : String(data.tradeNo || "");

  if (code !== 200) {
    const message =
      String(responsePayload.msg || responsePayload.message || "") ||
      "供货商 API 返回失败";
    await writeSupplierLog({
      order,
      requestPayload: params,
      responsePayload,
      success: false,
      message,
    });
    return { ok: false, message };
  }

  if (!secret) {
    await writeSupplierLog({
      order,
      requestPayload: params,
      responsePayload,
      success: false,
      message: "供货商未返回发货内容",
    });
    return { ok: false, message: "供货商未返回发货内容" };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const latestOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        paymentStatus: true,
        deliveryStatus: true,
        orderStatus: true,
        deliveredAt: true,
      },
    });

    if (!latestOrder || latestOrder.deliveryStatus === "delivered") {
      return;
    }

    if (latestOrder.paymentStatus !== "paid") {
      throw new Error("ORDER_NOT_PAID");
    }

    await tx.deliveryItem.create({
      data: {
        orderId: order.id,
        orderItemId: item.id,
        content: secret,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        deliveryStatus: "delivered",
        orderStatus: "completed",
        deliveredAt: latestOrder.deliveredAt || now,
        autoDeliveryStatus: "success",
        autoDeliveryMessage: "供货商 API 自动发货成功",
        autoDeliveryAttemptedAt: now,
        supplierTradeNo,
      },
    });
  });

  await writeSupplierLog({
    order,
    requestPayload: params,
    responsePayload,
    success: true,
    message: "供货商 API 自动发货成功",
  });

  return {
    ok: true,
    message: "供货商 API 自动发货成功",
    deliveryContent: secret,
    supplierTradeNo,
  };
}
