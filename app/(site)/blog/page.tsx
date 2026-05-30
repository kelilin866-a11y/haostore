import { ArticleStatus } from "@prisma/client";

import { ArticleCard } from "@/components/site/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) {
    return "未发布";
  }

  return date.toLocaleDateString("zh-CN");
}

export default async function BlogPage() {
  const [categories, articles] = await Promise.all([
    prisma.articleCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.published },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">SEO 文章</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">文章列表</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          展示已发布的使用教程、常见问题和订单帮助文章，内容由后台 SEO 文章管理维护。
        </p>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="deal" className="px-3 py-1">
          全部
        </Badge>
        {categories.map((category) => (
          <Badge key={category.id} variant="outline" className="px-3 py-1">
            {category.name}
          </Badge>
        ))}
      </div>
      {articles.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          暂无已发布文章。
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={{
                slug: article.slug,
                title: article.title,
                category: article.category.name,
                date: formatDate(article.publishedAt ?? article.createdAt),
                excerpt: article.summary ?? "暂无摘要",
                keyword: article.seoKeywords,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
