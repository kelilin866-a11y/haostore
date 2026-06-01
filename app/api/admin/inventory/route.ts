import { InventoryStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getInventoryLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return redirectTo("/admin/login?next=/admin/inventory");
  }

  const formData = await request.formData();
  const variantId = getFormString(formData, "variantId");
  const note = getFormString(formData, "note");
  const inventoryLines = getInventoryLines(getFormString(formData, "inventoryText"));

  if (!variantId) {
    return NextResponse.json(
      { ok: false, message: "缺少规格 ID，无法调整库存。" },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      const beforeStock = await tx.inventoryItem.count({
        where: {
          productId: variant.productId,
          variantId: variant.id,
          status: InventoryStatus.available,
        },
      });
      const afterStock = inventoryLines.length;

      await tx.inventoryItem.deleteMany({
        where: {
          productId: variant.productId,
          variantId: variant.id,
          status: InventoryStatus.available,
        },
      });

      if (inventoryLines.length > 0) {
        await tx.inventoryItem.createMany({
          data: inventoryLines.map((content) => ({
            productId: variant.productId,
            variantId: variant.id,
            content,
            status: InventoryStatus.available,
          })),
        });
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stockDisplay: afterStock },
      });

      await tx.inventoryLog.create({
        data: {
          productId: variant.productId,
          variantId: variant.id,
          beforeStock,
          afterStock,
          quantityChange: afterStock - beforeStock,
          operationType: "manual_adjust",
          note: note || null,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, message: "规格不存在，无法调整库存。" },
        { status: 404 },
      );
    }

    console.error("Adjust inventory failed", error);
    return NextResponse.json(
      { ok: false, message: "库存调整失败，请稍后重试。" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/inventory");
}
