"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateProductDescriptionTemplate,
  generateProductSeoDescription,
  generateProductSeoTitle,
  generateProductSlug,
} from "@/lib/product-auto-fill";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type ProductVariantFormValue = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  status: string;
  inventoryText: string;
};

type ProductFormValue = {
  id?: string;
  categoryId?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  notice?: string | null;
  deliveryFormat?: string | null;
  afterSales?: string | null;
  coverImage?: string | null;
  status?: string;
  variants?: ProductVariantFormValue[];
};

type ProductAdminFormProps = {
  action: string;
  title: string;
  submitLabel: string;
  categories: CategoryOption[];
  product?: ProductFormValue;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
};

function getVariantRows(product?: ProductFormValue) {
  const existing = product?.variants ?? [];
  const blankRows: ProductVariantFormValue[] = Array.from({ length: 3 }).map(
    () => ({
      name: "",
      sku: "",
      price: "",
      status: "active",
      inventoryText: "",
    }),
  );

  return [...existing, ...blankRows].slice(0, Math.max(existing.length + 2, 4));
}

function getInputValue(id: string) {
  const element = document.getElementById(id);
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value.trim();
  }

  return "";
}

function setInputValue(id: string, value: string, shouldOverwrite = true) {
  const element = document.getElementById(id);
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    )
  ) {
    return false;
  }

  if (!shouldOverwrite && element.value.trim()) {
    return false;
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function isImageUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim());
}

export function ProductAdminForm({
  action,
  title,
  submitLabel,
  categories,
  product,
}: ProductAdminFormProps) {
  const variantRows = getVariantRows(product);
  const initialCoverImage = product?.coverImage ?? "";
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [coverImagePreview, setCoverImagePreview] = useState(initialCoverImage);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });
  const showCoverPreview = isImageUrl(coverImagePreview);

  function getAutoFillInput() {
    const categoryId = getInputValue("categoryId");
    const category = categories.find((item) => item.id === categoryId);

    return {
      title: getInputValue("title"),
      categoryName: category?.name,
      categorySlug: category?.slug,
      summary: getInputValue("summary"),
      deliveryType: getInputValue("deliveryFormat"),
    };
  }

  function fillSlug(shouldOverwrite = true) {
    setInputValue(
      "slug",
      generateProductSlug(getAutoFillInput()),
      shouldOverwrite,
    );
  }

  function fillSeo(shouldOverwrite = true) {
    const input = getAutoFillInput();
    setInputValue("seoTitle", generateProductSeoTitle(input), shouldOverwrite);
    setInputValue(
      "seoDescription",
      generateProductSeoDescription(input),
      shouldOverwrite,
    );
  }

  function fillDescription(shouldOverwrite = true) {
    setInputValue(
      "description",
      generateProductDescriptionTemplate(getAutoFillInput()),
      shouldOverwrite,
    );
  }

  function fillAllEmptyFields() {
    fillSlug(false);
    fillSeo(false);
    fillDescription(false);
  }

  function clearCoverImage() {
    setInputValue("coverImage", "");
    setCoverImagePreview("");
    setUploadState({
      status: "idle",
      message: "已清空商品主图，保存商品后生效。",
    });
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadState({ status: "uploading", message: "上传中..." });

    try {
      const response = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.url) {
        setUploadState({
          status: "error",
          message: data.error || "图片上传失败，请稍后重试。",
        });
        return;
      }

      setInputValue("coverImage", data.url);
      setCoverImagePreview(data.url);
      setUploadState({
        status: "success",
        message: "图片上传成功，已填入商品主图 URL。保存商品后生效。",
      });
    } catch (error) {
      console.error("Upload product image failed", error);
      setUploadState({
        status: "error",
        message: "图片上传失败，请检查网络或 OSS 配置。",
      });
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  return (
    <form action={action} method="post" className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="rounded-md border border-teal-100 bg-teal-50 p-4">
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => fillSlug()}>
                生成 slug
              </Button>
              <Button type="button" variant="outline" onClick={() => fillSeo()}>
                生成 SEO
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fillDescription()}
              >
                生成默认说明
              </Button>
              <Button type="button" variant="deal" onClick={fillAllEmptyFields}>
                一键生成上架内容
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              一键生成只会填充空字段；单独生成按钮会按当前标题、分类和简介重新生成对应内容。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">商品名称</Label>
              <Input
                id="title"
                name="title"
                defaultValue={product?.title ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={product?.slug ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">商品分类</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
                required
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">商品主图/占位图</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  id="coverImage"
                  name="coverImage"
                  defaultValue={initialCoverImage}
                  placeholder="图片 URL 或占位说明"
                  onChange={(event) => {
                    setCoverImagePreview(event.target.value);
                    setUploadState({ status: "idle", message: "" });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadState.status === "uploading"}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {uploadState.status === "uploading" ? "上传中..." : "上传图片"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadState.status === "uploading" && !coverImagePreview}
                  onClick={clearCoverImage}
                >
                  清空图片
                </Button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
              <p className="text-xs text-slate-500">
                支持 jpg、jpeg、png、webp，单张不超过 5MB。上传成功后仍需点击保存商品。
              </p>
              {uploadState.message ? (
                <p
                  className={`text-xs ${
                    uploadState.status === "error"
                      ? "text-red-500"
                      : "text-emerald-600"
                  }`}
                >
                  {uploadState.message}
                </p>
              ) : null}
              {showCoverPreview ? (
                <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImagePreview}
                    alt="商品主图预览"
                    className="h-48 w-full object-cover"
                    onError={() =>
                      setUploadState({
                        status: "error",
                        message: "图片预览加载失败，请检查 URL 是否可访问。",
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">商品简介</Label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={product?.summary ?? ""}
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input
                id="seoTitle"
                name="seoTitle"
                defaultValue={product?.seoTitle ?? ""}
                placeholder="建议 60 个字符以内"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                defaultValue={product?.seoDescription ?? ""}
                rows={3}
                placeholder="建议 80-160 个字符"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">商品说明</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              rows={7}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="notice">注意事项</Label>
              <textarea
                id="notice"
                name="notice"
                defaultValue={product?.notice ?? ""}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryFormat">发货说明</Label>
              <textarea
                id="deliveryFormat"
                name="deliveryFormat"
                defaultValue={product?.deliveryFormat ?? ""}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afterSales">售后说明</Label>
              <textarea
                id="afterSales"
                name="afterSales"
                defaultValue={product?.afterSales ?? ""}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={(product?.status ?? "active") === "active"}
              className="h-4 w-4 rounded border-slate-300"
            />
            是否上架
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>商品规格与库存</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {variantRows.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <input
                type="hidden"
                name={`variantId_${index}`}
                value={variant.id ?? ""}
              />
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px_120px]">
                <div className="space-y-2">
                  <Label htmlFor={`variantName_${index}`}>规格名称</Label>
                  <Input
                    id={`variantName_${index}`}
                    name={`variantName_${index}`}
                    defaultValue={variant.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variantSku_${index}`}>规格编码 sku</Label>
                  <Input
                    id={`variantSku_${index}`}
                    name={`variantSku_${index}`}
                    defaultValue={variant.sku}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variantPrice_${index}`}>价格</Label>
                  <Input
                    id={`variantPrice_${index}`}
                    name={`variantPrice_${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={variant.price}
                  />
                </div>
                <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={`variantEnabled_${index}`}
                    defaultChecked={variant.status !== "inactive"}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  是否启用
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variantInventory_${index}`}>
                  库存文本（每行一条，库存数=行数）
                </Label>
                <textarea
                  id={`variantInventory_${index}`}
                  name={`variantInventory_${index}`}
                  defaultValue={variant.inventoryText}
                  rows={4}
                  placeholder="账号----密码----邮箱----邮箱密码"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                />
              </div>
            </div>
          ))}
          <input type="hidden" name="variantCount" value={variantRows.length} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="deal">
          {submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/products">返回商品列表</Link>
        </Button>
      </div>
    </form>
  );
}
