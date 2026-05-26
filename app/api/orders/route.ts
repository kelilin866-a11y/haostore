import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

type OrderBody = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  contact?: unknown;
  paymentMethod?: unknown;
};

const allowedPaymentMethods = new Set<string>([
  PaymentMethod.manual_alipay,
  PaymentMethod.manual_wechat,
  PaymentMethod.manual_usdt,
  PaymentMethod.gateway_reserved,
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function detectContactType(contact: string) {
  if (contact.startsWith("@")) {
    return "telegram";
  }
  if (contact.includes("@")) {
    return "email";
  }
  if (/^\+?\d+$/.test(contact)) {
    return "phone";
  }
  return "other";
}

function createOrderNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

  return `HM${yyyy}${mm}${dd}${random}`;
}

async function generateUniqueOrderNo() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNo = createOrderNo();
    const exists = await prisma.order.findUnique({
      where: { orderNo },
      select: { id: true },
    });
    if (!exists) {
      return orderNo;
    }
  }

  throw new Error("Unable to generate unique order number");
}

function getCustomerIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  let body: OrderBody;

  try {
    body = (await request.json()) as OrderBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const variantId = typeof body.variantId === "string" ? body.variantId : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const paymentMethod =
    typeof body.paymentMethod === "string" ? body.paymentMethod : "";
  const quantity = Number(body.quantity);

  if (!productId || !variantId) {
    return jsonError("商品或规格参数缺失");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return jsonError("购买数量必须是正整数");
  }
  if (!contact) {
    return jsonError("联系方式不能为空");
  }
  if (!allowedPaymentMethods.has(paymentMethod)) {
    return jsonError("支付方式无效");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "active",
    },
    include: {
      variants: {
        where: {
          id: variantId,
          status: "active",
        },
      },
    },
  });

  if (!product) {
    return jsonError("商品不存在或未上架", 404);
  }

  const variant = product.variants[0];
  if (!variant || variant.productId !== product.id) {
    return jsonError("规格不存在或不可购买", 404);
  }

  const availableCount = await prisma.inventoryItem.count({
    where: {
      productId,
      variantId,
      status: "available",
    },
  });

  if (availableCount < quantity) {
    return jsonError("当前规格库存不足，请减少数量或选择其他规格");
  }

  const unitPrice = variant.price;
  const subtotal = unitPrice.mul(quantity);
  const orderNo = await generateUniqueOrderNo();

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          contact,
          contactType: detectContactType(contact),
          totalAmount: subtotal,
          paymentStatus: "pending",
          deliveryStatus: "pending",
          orderStatus: "pending_payment",
          paymentMethod: paymentMethod as PaymentMethod,
          customerIp: getCustomerIp(request),
          userAgent: request.headers.get("user-agent"),
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          variantId: variant.id,
          productTitleSnapshot: product.title,
          variantNameSnapshot: variant.name,
          unitPriceSnapshot: unitPrice,
          quantity,
          subtotal,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("订单号生成冲突，请重试");
    }
    return jsonError("订单创建失败，请稍后重试", 500);
  }

  return NextResponse.json({
    ok: true,
    orderNo,
    redirectUrl: `/order/${orderNo}/pay`,
  });
}
