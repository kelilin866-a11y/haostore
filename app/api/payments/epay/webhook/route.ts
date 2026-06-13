import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  getEpayConfig,
  moneyToCents,
  verifyEpayNotify,
  writeEpayPaymentLog,
} from "@/lib/payments/epay";

export const runtime = "nodejs";

function text(value: "success" | "fail") {
  return new NextResponse(value, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function paramsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries()) as Record<string, string>;
}

async function parsePostPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const body = await request.text();
    return paramsToObject(new URLSearchParams(body));
  }

  const formData = await request.formData();
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [
      key,
      typeof value === "string" ? value : value.name,
    ]),
  ) as Record<string, string>;
}

function getPaymentMethod(type: string, existingMethod: string) {
  if (existingMethod === "epay_alipay" || existingMethod === "epay_wxpay") {
    return existingMethod as PaymentMethod;
  }

  return type === "wxpay" ? PaymentMethod.epay_wxpay : PaymentMethod.epay_alipay;
}

async function handleEpayNotify(payload: Record<string, string>) {
  const config = await getEpayConfig();
  const orderNo = payload.out_trade_no || "";
  const channel = payload.type || "";

  if (!verifyEpayNotify(payload, config)) {
    await writeEpayPaymentLog({
      orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: "epay 回调验签失败",
    });
    return text("fail");
  }

  if (payload.trade_status !== "TRADE_SUCCESS") {
    await writeEpayPaymentLog({
      orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: `忽略非成功交易状态：${payload.trade_status || "empty"}`,
    });
    return text("success");
  }

  if (!orderNo) {
    await writeEpayPaymentLog({
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: "epay 回调缺少 out_trade_no",
    });
    return text("fail");
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
    await writeEpayPaymentLog({
      orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: "本地订单不存在",
    });
    return text("fail");
  }

  const callbackMoney = payload.money || "";
  if (moneyToCents(callbackMoney) !== moneyToCents(order.totalAmount)) {
    await writeEpayPaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: `金额不一致：callback=${callbackMoney}, order=${order.totalAmount.toString()}`,
    });
    return text("fail");
  }

  const paymentMethod = getPaymentMethod(channel, order.paymentMethod);
  const transactionId = payload.trade_no || "";
  const note = JSON.stringify({
    provider: "epay",
    channel,
    trade_no: payload.trade_no || "",
    api_trade_no: payload.api_trade_no || "",
    type: payload.type || "",
    buyer: payload.buyer || "",
    endtime: payload.endtime || "",
    raw: payload,
  });

  if (order.paymentStatus === PaymentStatus.paid) {
    await writeEpayPaymentLog({
      orderId: order.id,
      orderNo: order.orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: true,
      message: "订单已支付，重复回调直接确认",
    });
    return text("success");
  }

  await prisma.$transaction(async (tx) => {
    const existingRecord =
      order.paymentRecords.find(
        (record) => record.transactionId === payload.trade_no,
      ) || order.paymentRecords[0];
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
        ...(order.orderStatus === "completed" ? {} : { orderStatus: "paid" }),
        paidAt: order.paidAt || new Date(),
      },
    });
  });

  await writeEpayPaymentLog({
    orderId: order.id,
    orderNo: order.orderNo,
    channel,
    event: "webhook",
    responsePayload: payload,
    success: true,
    message: "epay 回调确认付款成功",
  });

  return text("success");
}

export async function GET(request: NextRequest) {
  return handleEpayNotify(paramsToObject(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  return handleEpayNotify(await parsePostPayload(request));
}
