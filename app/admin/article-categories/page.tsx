import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminArticleCategoriesPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/article-categories");
  }

  const categories = await prisma.articleCategory.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accentblue">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">文章分类管理</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            SEO 文章新增和编辑时只能选择已启用分类。请先创建文章分类，再维护文章内容。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="deal" asChild>
            <Link href="/admin/article-categories/new">新增文章分类</Link>
          </Button>
          <AdminLogoutButton />
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            暂无文章分类，请先新增分类。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <p className="mt-2 text-sm text-slate-500">
                      slug：{category.slug} / 排序：{category.sortOrder}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={category.isActive ? "success" : "outline"}>
                      {category.isActive ? "已启用" : "已停用"}
                    </Badge>
                    <Badge variant="deal">文章 {category._count.articles}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm leading-6 text-slate-500">
                  {category.description || "暂无说明"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/article-categories/${category.id}/edit`}>
                      编辑分类
                    </Link>
                  </Button>
                  <form
                    action={`/api/admin/article-categories/${category.id}/status`}
                    method="post"
                  >
                    <input
                      type="hidden"
                      name="isActive"
                      value={category.isActive ? "false" : "true"}
                    />
                    <Button variant="outline" size="sm" type="submit">
                      {category.isActive ? "停用" : "启用"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
