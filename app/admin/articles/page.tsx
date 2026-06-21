import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { getArticlePublishState } from "@/lib/article-visibility";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/articles");
  }

  const articles = await prisma.article.findMany({
    include: {
      category: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accentblue">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">SEO文章管理</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            管理前台 SEO 文章的标题、正文、摘要和 SEO 元信息。前台仅展示已发布且发布时间已到的文章。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="deal" asChild>
            <Link href="/admin/articles/new">新增文章</Link>
          </Button>
          <AdminLogoutButton />
        </div>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无文章，请先新增 SEO 文章。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {articles.map((article) => {
            const publishState = getArticlePublishState(
              article.status,
              article.publishedAt,
            );

            return (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>{article.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-500">
                        /blog/{article.slug} / {article.category.name}
                      </p>
                    </div>
                    <Badge variant={publishState.badgeVariant}>
                      {publishState.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm leading-6 text-slate-500">
                    {article.summary || "暂无摘要"}
                  </p>
                  <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                    <p>SEO标题：{article.seoTitle || "未设置"}</p>
                    <p>SEO描述：{article.seoDescription || "未设置"}</p>
                    <p>
                      发布时间：
                      {article.publishedAt
                        ? formatDateTime(article.publishedAt)
                        : "未发布"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          编辑文章
                        </Link>
                      </Button>
                      <form
                        action={`/api/admin/articles/${article.id}/status`}
                        method="post"
                      >
                        <input
                          type="hidden"
                          name="status"
                          value={
                            article.status === "published"
                              ? "draft"
                              : "published"
                          }
                        />
                        <Button variant="outline" size="sm" type="submit">
                          {article.status === "published" ? "下架" : "发布"}
                        </Button>
                      </form>
                    </div>
                    <p className="text-xs text-slate-500">
                      更新时间：{formatDateTime(article.updatedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
