import { redirect } from "next/navigation";

import { ArticleAdminForm } from "@/components/site/ArticleAdminForm";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/articles/new");
  }

  const categories = await prisma.articleCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无可用文章分类，请先准备文章分类后再新增文章。
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">新增SEO文章</h1>
      </div>
      <ArticleAdminForm
        action="/api/admin/articles"
        title="文章信息"
        submitLabel="创建文章"
        categories={categories}
      />
    </div>
  );
}
