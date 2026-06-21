import { notFound, redirect } from "next/navigation";

import { ArticleAdminForm } from "@/components/site/ArticleAdminForm";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=/admin/articles/${params.id}/edit`);
  }

  const [categories, article] = await Promise.all([
    prisma.articleCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.article.findUnique({
      where: { id: params.id },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">编辑SEO文章</h1>
      </div>
      <ArticleAdminForm
        action={`/api/admin/articles/${article.id}`}
        title="文章信息"
        submitLabel="保存文章"
        categories={categories}
        article={{
          id: article.id,
          categoryId: article.categoryId,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          coverImage: article.coverImage,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          publishedAt: article.publishedAt?.toISOString() ?? null,
          status: article.status,
        }}
      />
    </div>
  );
}
