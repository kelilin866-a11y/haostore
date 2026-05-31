import { redirect } from "next/navigation";

import { CategoryAdminForm } from "@/components/site/CategoryAdminForm";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function NewArticleCategoryPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/article-categories/new");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">新增文章分类</h1>
      </div>
      <CategoryAdminForm
        action="/api/admin/article-categories"
        backHref="/admin/article-categories"
        title="文章分类信息"
        submitLabel="创建分类"
      />
    </div>
  );
}
