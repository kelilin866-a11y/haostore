import { redirect } from "next/navigation";

import { ProductAdminForm } from "@/components/site/ProductAdminForm";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/products/new");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无可用分类，请先准备商品分类后再新增商品。
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">新增商品</h1>
      </div>
      <ProductAdminForm
        action="/api/admin/products"
        title="商品信息"
        submitLabel="创建商品"
        categories={categories}
      />
    </div>
  );
}
