import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  isUniqueConstraintError,
  parseProductForm,
  redirectTo,
  requireAdmin,
  syncVariantInventory,
  validateProductForm,
} from "./product-form";

export async function POST(request: Request) {
  const authRedirect = requireAdmin(request);
  if (authRedirect) {
    return authRedirect;
  }

  const formData = await request.formData();
  const data = parseProductForm(formData);
  const validationError = validateProductForm(data);

  if (validationError) {
    return NextResponse.json(
      { ok: false, message: validationError },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          categoryId: data.categoryId,
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          notice: data.notice,
          deliveryFormat: data.deliveryFormat,
          afterSales: data.afterSales,
          coverImage: data.coverImage,
          status: data.status,
          deliveryMode: data.deliveryMode,
          supplierApiBaseUrl: data.supplierApiBaseUrl,
          supplierAppId: data.supplierAppId,
          supplierAppKey: data.supplierAppKey,
          supplierSharedCode: data.supplierSharedCode,
          supplierRace: data.supplierRace,
          supplierSkuJson: data.supplierSkuJson,
          supplierCardId: data.supplierCardId,
          supplierDevice: data.supplierDevice,
        },
      });

      for (const variant of data.variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stockDisplay: variant.inventoryLines.length,
            status: variant.status,
            sortOrder: variant.sortOrder,
          },
        });

        await syncVariantInventory({
          productId: product.id,
          variantId: createdVariant.id,
          inventoryLines: variant.inventoryLines,
          db: tx,
        });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { ok: false, message: "slug 或 sku 已存在，请更换后重试" },
        { status: 400 },
      );
    }

    console.error("Create product failed", error);
    return NextResponse.json(
      { ok: false, message: "商品创建失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/products");
}
