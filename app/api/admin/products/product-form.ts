import { NextResponse } from "next/server";
import {
  InventoryStatus,
  Prisma,
  ProductStatus,
  VariantStatus,
} from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export type ParsedProductForm = {
  categoryId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  notice: string;
  deliveryFormat: string;
  afterSales: string;
  coverImage: string;
  status: ProductStatus;
  variants: ParsedVariantForm[];
};

export type ParsedVariantForm = {
  id: string;
  name: string;
  sku: string;
  price: string;
  status: VariantStatus;
  inventoryLines: string[];
  sortOrder: number;
};

type InventoryClient = Pick<Prisma.TransactionClient, "inventoryItem">;

export function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

export function requireAdmin(request: Request) {
  if (getAdminSession()) {
    return null;
  }

  return redirectTo("/admin/login?next=/admin/products");
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

function hasVariantInput({
  id,
  name,
  sku,
  price,
  inventoryLines,
}: {
  id: string;
  name: string;
  sku: string;
  price: string;
  inventoryLines: string[];
}) {
  return Boolean(id || name || sku || price || inventoryLines.length > 0);
}

export function parseProductForm(formData: FormData): ParsedProductForm {
  const variantCount = Number(getFormString(formData, "variantCount") || 0);
  const variants: ParsedVariantForm[] = [];

  for (let index = 0; index < variantCount; index += 1) {
    const id = getFormString(formData, `variantId_${index}`);
    const name = getFormString(formData, `variantName_${index}`);
    const sku = getFormString(formData, `variantSku_${index}`);
    const price = getFormString(formData, `variantPrice_${index}`);
    const inventoryLines = getInventoryLines(
      getFormString(formData, `variantInventory_${index}`),
    );

    if (!hasVariantInput({ id, name, sku, price, inventoryLines })) {
      continue;
    }

    variants.push({
      id,
      name,
      sku,
      price,
      inventoryLines,
      sortOrder: index + 1,
      status: formData.get(`variantEnabled_${index}`)
        ? VariantStatus.active
        : VariantStatus.inactive,
    });
  }

  return {
    categoryId: getFormString(formData, "categoryId"),
    title: getFormString(formData, "title"),
    slug: getFormString(formData, "slug"),
    summary: getFormString(formData, "summary"),
    description: getFormString(formData, "description"),
    seoTitle: getFormString(formData, "seoTitle"),
    seoDescription: getFormString(formData, "seoDescription"),
    notice: getFormString(formData, "notice"),
    deliveryFormat: getFormString(formData, "deliveryFormat"),
    afterSales: getFormString(formData, "afterSales"),
    coverImage: getFormString(formData, "coverImage"),
    status: formData.get("isActive") ? ProductStatus.active : ProductStatus.inactive,
    variants,
  };
}

export function validateProductForm(data: ParsedProductForm) {
  if (!data.categoryId || !data.title || !data.slug) {
    return "商品名称、slug 和分类不能为空";
  }

  if (data.variants.length === 0) {
    return "至少需要填写一个商品规格";
  }

  const skus = new Set<string>();

  for (const variant of data.variants) {
    if (!variant.name || !variant.sku || !variant.price) {
      return "规格名称、sku 和价格不能为空";
    }

    const price = Number(variant.price);
    if (!Number.isFinite(price) || price < 0) {
      return `规格 ${variant.name} 的价格无效`;
    }

    if (skus.has(variant.sku)) {
      return `规格 sku 重复：${variant.sku}`;
    }
    skus.add(variant.sku);
  }

  return null;
}

export async function syncVariantInventory({
  productId,
  variantId,
  inventoryLines,
  db = prisma,
}: {
  productId: string;
  variantId: string;
  inventoryLines: string[];
  db?: InventoryClient;
}) {
  await db.inventoryItem.deleteMany({
    where: {
      productId,
      variantId,
      status: InventoryStatus.available,
    },
  });

  if (inventoryLines.length === 0) {
    return;
  }

  await db.inventoryItem.createMany({
    data: inventoryLines.map((content, index) => ({
      productId,
      variantId,
      content,
      status: InventoryStatus.available,
      sortOrder: index,
    })),
  });
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
