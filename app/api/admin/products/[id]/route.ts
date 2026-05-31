import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import {
  isUniqueConstraintError,
  parseProductForm,
  redirectTo,
  requireAdmin,
  syncVariantInventory,
  validateProductForm,
} from "../product-form";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
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
      const product = await tx.product.update({
        where: { id: params.id },
        data: {
          categoryId: data.categoryId,
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          notice: data.notice,
          deliveryFormat: data.deliveryFormat,
          afterSales: data.afterSales,
          coverImage: data.coverImage,
          status: data.status,
        },
      });

      for (const variant of data.variants) {
        let variantId = variant.id;

        if (variantId) {
          const existingVariant = await tx.productVariant.findFirst({
            where: {
              id: variantId,
              productId: product.id,
            },
          });

          if (!existingVariant) {
            throw new Error("Variant does not belong to product");
          }

          await tx.productVariant.update({
            where: { id: variantId },
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              stockDisplay: variant.inventoryLines.length,
              status: variant.status,
              sortOrder: variant.sortOrder,
            },
          });
        } else {
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

          variantId = createdVariant.id;
        }

        await syncVariantInventory({
          productId: product.id,
          variantId,
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

    console.error("Update product failed", error);
    return NextResponse.json(
      { ok: false, message: "商品更新失败，请稍后重试" },
      { status: 500 },
    );
  }

  return redirectTo("/admin/products");
}
