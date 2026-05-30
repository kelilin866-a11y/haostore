import { notFound, redirect } from "next/navigation";

import { ProductAdminForm } from "@/components/site/ProductAdminForm";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=/admin/products/${params.id}/edit`);
  }

  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            inventoryItems: {
              where: { status: "available" },
              orderBy: { createdAt: "asc" },
              select: { content: true },
            },
          },
        },
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">编辑商品</h1>
      </div>
      <ProductAdminForm
        action={`/api/admin/products/${product.id}`}
        title="商品信息"
        submitLabel="保存商品"
        categories={categories}
        product={{
          id: product.id,
          categoryId: product.categoryId,
          title: product.title,
          slug: product.slug,
          summary: product.summary,
          description: product.description,
          notice: product.notice,
          deliveryFormat: product.deliveryFormat,
          afterSales: product.afterSales,
          coverImage: product.coverImage,
          status: product.status,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price.toString(),
            status: variant.status,
            inventoryText: variant.inventoryItems
              .map((item) => item.content)
              .join("\n"),
          })),
        }}
      />
    </div>
  );
}
