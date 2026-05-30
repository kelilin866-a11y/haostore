import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryOption = {
  id: string;
  name: string;
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

export function ProductAdminForm({
  action,
  title,
  submitLabel,
  categories,
  product,
}: ProductAdminFormProps) {
  const variantRows = getVariantRows(product);

  return (
    <form action={action} method="post" className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
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
              <Input
                id="coverImage"
                name="coverImage"
                defaultValue={product?.coverImage ?? ""}
                placeholder="图片 URL 或占位说明"
              />
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

          <div className="space-y-2">
            <Label htmlFor="description">商品说明</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              rows={5}
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
