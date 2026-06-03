"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type InventoryVariantOption = {
  id: string;
  name: string;
  sku: string;
  status: string;
};

type InventoryProductOption = {
  id: string;
  title: string;
  categoryName: string;
  variants: InventoryVariantOption[];
};

type BulkImportResult = {
  success: boolean;
  imported: number;
  skippedEmpty: number;
  skippedDuplicate: number;
  failed: number;
  message: string;
};

type BulkInventoryImportFormProps = {
  products: InventoryProductOption[];
};

export function BulkInventoryImportForm({
  products,
}: BulkInventoryImportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [productId, products],
  );
  const [variantId, setVariantId] = useState(
    selectedProduct?.variants[0]?.id ?? "",
  );
  const [contentText, setContentText] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const availableVariants = selectedProduct?.variants ?? [];
  const isSubmitting = isPending;

  function handleProductChange(nextProductId: string) {
    const nextProduct = products.find((product) => product.id === nextProductId);

    setProductId(nextProductId);
    setVariantId(nextProduct?.variants[0]?.id ?? "");
    setResult(null);
  }

  async function handleSubmit() {
    setResult(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/inventory/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            variantId,
            contentText,
            note,
          }),
        });
        const data = (await response.json()) as BulkImportResult;

        setResult(data);

        if (response.ok && data.success) {
          setContentText("");
          setNote("");
          router.refresh();
        }
      } catch (error) {
        console.error("Bulk import inventory failed", error);
        setResult({
          success: false,
          imported: 0,
          skippedEmpty: 0,
          skippedDuplicate: 0,
          failed: 0,
          message: "批量导入失败，请稍后重试。",
        });
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bulkProductId">选择商品</Label>
          <select
            id="bulkProductId"
            value={productId}
            onChange={(event) => handleProductChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title} / {product.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulkVariantId">选择商品规格 SKU</Label>
          <select
            id="bulkVariantId"
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setResult(null);
            }}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
          >
            {availableVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} / {variant.sku} /{" "}
                {variant.status === "active" ? "启用" : "停用"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulkInventoryText">库存内容</Label>
        <textarea
          id="bulkInventoryText"
          value={contentText}
          onChange={(event) => {
            setContentText(event.target.value);
            setResult(null);
          }}
          rows={8}
          placeholder="账号----密码----邮箱----邮密----辅邮----辅密----2fa----token"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulkInventoryNote">备注</Label>
        <input
          id="bulkInventoryNote"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
          placeholder="例如：每日补货、供应商批次、手动导入"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>每行一条库存内容，导入后不会覆盖已有库存。</p>
        <p>重复内容会自动跳过，请确保卡密格式与该商品发货格式一致。</p>
      </div>

      {result ? (
        <div
          className={`rounded-md border p-4 text-sm ${
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-semibold">{result.message}</p>
          <p className="mt-2">
            成功导入 {result.imported} 条 / 跳过空行{" "}
            {result.skippedEmpty} 条 / 跳过重复 {result.skippedDuplicate} 条 /
            失败 {result.failed} 条
          </p>
        </div>
      ) : null}

      <div>
        <Button
          type="button"
          variant="deal"
          disabled={isSubmitting || !productId || !variantId}
          onClick={handleSubmit}
        >
          {isSubmitting ? "导入中..." : "批量导入"}
        </Button>
      </div>
    </div>
  );
}
