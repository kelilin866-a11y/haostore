import { notFound, redirect } from "next/navigation";

import { CategoryAdminForm } from "@/components/site/CategoryAdminForm";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditArticleCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=/admin/article-categories/${params.id}/edit`);
  }

  const category = await prisma.articleCategory.findUnique({
    where: { id: params.id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">编辑文章分类</h1>
      </div>
      <CategoryAdminForm
        action={`/api/admin/article-categories/${category.id}`}
        backHref="/admin/article-categories"
        title="文章分类信息"
        submitLabel="保存分类"
        category={category}
      />
    </div>
  );
}
