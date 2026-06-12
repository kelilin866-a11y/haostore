import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  getNezhaPaymentType,
  isNezhaPaymentCode,
  moneyToCents,
  verifyNezhaParams,
  writePaymentLog,
} from "@/lib/payments/nezha";

export const runtime = "nodejs";

function text(value: "success" | "fail") {
  return new NextResponse(value, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function paramsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries()) as Record<string, string>;
}

function getPaymentMethod(type: string, existingMethod: string) {
  if (isNezhaPaymentCode(existingMethod)) {
    return existingMethod;
  }
  return type === "wxpay" ? "nezha_wxpay" : "nezha_alipay";
}

export async function GET(request: NextRequest) {
  const payload = paramsToObject(request.nextUrl.searchParams);
  const orderNo = payload.out_trade_no || "";
  const channel = payload.type || "";

  console.log("[nezha/webhook] received", {
    orderNo,
    tradeStatus: payload.trade_status,
    type: channel,
    tradeNo: payload.trade_no,
    apiTradeNo: payload.api_trade_no,
  });

  if (!verifyNezhaParams(payload)) {
    await writePaymentLog({
      orderNo,
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: "哪吒支付回调验签失败",
    });
    return text("fail");
  }

  if (payload.trade_status !== "TRADE_SUCCESS") {
    await writePaymentLog({
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
    await writePaymentLog({
      channel,
      event: "webhook",
      responsePayload: payload,
      success: false,
      message: "哪吒支付回调缺少 out_trade_no",
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
    await writePaymentLog({
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
    await writePaymentLog({
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

  const paymentMethod = getPaymentMethod(
    channel,
    order.paymentMethod,
  ) as PaymentMethod;
  const transactionId = payload.trade_no || payload.api_trade_no || "";
  const note = JSON.stringify({
    provider: "nezha",
    channel,
    trade_no: payload.trade_no || "",
    api_trade_no: payload.api_trade_no || "",
    type: payload.type || "",
    buyer: payload.buyer || "",
    endtime: payload.endtime || "",
    raw: payload,
  });

  if (order.paymentStatus === PaymentStatus.paid) {
    await writePaymentLog({
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
      order.paymentRecords.find((record) => {
        return (
          record.transactionId === payload.trade_no ||
          record.transactionId === payload.api_trade_no
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
        ...(order.orderStatus === "completed" ? {} : { orderStatus: "paid" }),
        paidAt: order.paidAt || new Date(),
      },
    });
  });

  await writePaymentLog({
    orderId: order.id,
    orderNo: order.orderNo,
    channel: getNezhaPaymentType(paymentMethod as "nezha_alipay" | "nezha_wxpay"),
    event: "webhook",
    responsePayload: payload,
    success: true,
    message: "哪吒支付回调确认付款成功",
  });

  return text("success");
}
