import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ArticleCategoryOption = {
  id: string;
  name: string;
};

type ArticleFormValue = {
  id?: string;
  categoryId?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  content?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: string;
};

type ArticleAdminFormProps = {
  action: string;
  title: string;
  submitLabel: string;
  categories: ArticleCategoryOption[];
  article?: ArticleFormValue;
};

export function ArticleAdminForm({
  action,
  title,
  submitLabel,
  categories,
  article,
}: ArticleAdminFormProps) {
  return (
    <form action={action} method="post" className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                name="title"
                defaultValue={article?.title ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={article?.slug ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">文章分类</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={article?.categoryId ?? categories[0]?.id ?? ""}
                required
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <select
                id="status"
                name="status"
                defaultValue={article?.status ?? "draft"}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">摘要</Label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={article?.summary ?? ""}
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">正文内容</Label>
            <textarea
              id="content"
              name="content"
              defaultValue={article?.content ?? ""}
              rows={14}
              required
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            />
            <p className="text-xs text-slate-500">
              可使用简单 Markdown 风格标题，例如 ## 二级标题、### 三级标题。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO标题</Label>
              <Input
                id="seoTitle"
                name="seoTitle"
                defaultValue={article?.seoTitle ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO描述</Label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                defaultValue={article?.seoDescription ?? ""}
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="deal">
          {submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/articles">返回文章列表</Link>
        </Button>
      </div>
    </form>
  );
}
