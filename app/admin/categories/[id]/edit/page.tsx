import { notFound, redirect } from "next/navigation";

import { CategoryAdminForm } from "@/components/site/CategoryAdminForm";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=/admin/categories/${params.id}/edit`);
  }

  const category = await prisma.category.findUnique({
    where: { id: params.id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">编辑商品分类</h1>
      </div>
      <CategoryAdminForm
        action={`/api/admin/categories/${category.id}`}
        backHref="/admin/categories"
        title="商品分类信息"
        submitLabel="保存分类"
        category={category}
      />
    </div>
  );
}
