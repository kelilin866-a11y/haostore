import { InventoryStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type BulkImportBody = {
  productId?: string;
  variantId?: string;
  skuId?: string;
  contentText?: string;
  lines?: string[];
  note?: string;
};

function parseLines(body: BulkImportBody) {
  const rawLines = Array.isArray(body.lines)
    ? body.lines
    : (body.contentText ?? "").split(/\r?\n/);
  const trimmedLines = rawLines.map((line) => line.trim());
  const skippedEmpty = trimmedLines.filter((line) => !line).length;

  return {
    skippedEmpty,
    lines: trimmedLines.filter(Boolean),
  };
}

function jsonResult(
  body: {
    success: boolean;
    imported: number;
    skippedEmpty: number;
    skippedDuplicate: number;
    failed: number;
    message: string;
  },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return jsonResult(
      {
        success: false,
        imported: 0,
        skippedEmpty: 0,
        skippedDuplicate: 0,
        failed: 0,
        message: "未登录或后台登录已过期，请重新登录。",
      },
      401,
    );
  }

  let body: BulkImportBody;

  try {
    body = (await request.json()) as BulkImportBody;
  } catch {
    return jsonResult(
      {
        success: false,
        imported: 0,
        skippedEmpty: 0,
        skippedDuplicate: 0,
        failed: 0,
        message: "请求格式无效，请刷新后重试。",
      },
      400,
    );
  }

  const productId = body.productId?.trim() ?? "";
  const variantId = (body.variantId ?? body.skuId ?? "").trim();
  const { lines, skippedEmpty } = parseLines(body);

  if (!variantId) {
    return jsonResult(
      {
        success: false,
        imported: 0,
        skippedEmpty,
        skippedDuplicate: 0,
        failed: 0,
        message: "缺少 SKU，请选择商品规格后再导入。",
      },
      400,
    );
  }

  if (lines.length === 0) {
    return jsonResult(
      {
        success: false,
        imported: 0,
        skippedEmpty,
        skippedDuplicate: 0,
        failed: 0,
        message: "库存内容为空，请粘贴至少一行有效内容。",
      },
      400,
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      if (productId && variant.productId !== productId) {
        throw new Error("VARIANT_PRODUCT_MISMATCH");
      }

      const beforeStock = await tx.inventoryItem.count({
        where: {
          productId: variant.productId,
          variantId: variant.id,
          status: InventoryStatus.available,
        },
      });
      const uniqueInputLines = Array.from(new Set(lines));
      const existingItems = await tx.inventoryItem.findMany({
        where: {
          variantId: variant.id,
          content: { in: uniqueInputLines },
        },
        select: { content: true },
      });
      const existingContent = new Set(existingItems.map((item) => item.content));
      const seen = new Set<string>();
      const importLines: string[] = [];
      let skippedDuplicate = 0;

      for (const line of lines) {
        if (seen.has(line) || existingContent.has(line)) {
          skippedDuplicate += 1;
          continue;
        }

        seen.add(line);
        importLines.push(line);
      }

      const maxSortOrder = await tx.inventoryItem.aggregate({
        where: {
          productId: variant.productId,
          variantId: variant.id,
          status: InventoryStatus.available,
        },
        _max: { sortOrder: true },
      });
      const sortOrderStart = (maxSortOrder._max.sortOrder ?? -1) + 1;

      if (importLines.length > 0) {
        await tx.inventoryItem.createMany({
          data: importLines.map((content, index) => ({
            productId: variant.productId,
            variantId: variant.id,
            content,
            status: InventoryStatus.available,
            sortOrder: sortOrderStart + index,
          })),
        });
      }

      const afterStock = beforeStock + importLines.length;

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
          quantityChange: importLines.length,
          operationType: "manual_adjust",
          note: body.note?.trim() || "批量导入库存",
        },
      });

      return {
        imported: importLines.length,
        skippedDuplicate,
        failed: 0,
      };
    });

    return jsonResult({
      success: true,
      imported: result.imported,
      skippedEmpty,
      skippedDuplicate: result.skippedDuplicate,
      failed: result.failed,
      message: `批量导入完成，成功导入 ${result.imported} 条。`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return jsonResult(
        {
          success: false,
          imported: 0,
          skippedEmpty,
          skippedDuplicate: 0,
          failed: lines.length,
          message: "SKU 不存在，请刷新页面后重新选择规格。",
        },
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message === "VARIANT_PRODUCT_MISMATCH"
    ) {
      return jsonResult(
        {
          success: false,
          imported: 0,
          skippedEmpty,
          skippedDuplicate: 0,
          failed: lines.length,
          message: "所选 SKU 不属于当前商品，请重新选择。",
        },
        400,
      );
    }

    console.error("Bulk import inventory failed", error);
    return jsonResult(
      {
        success: false,
        imported: 0,
        skippedEmpty,
        skippedDuplicate: 0,
        failed: lines.length,
        message: "数据库写入失败，请稍后重试。",
      },
      500,
    );
  }
}
