"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  status?: string;
};

type ArticleAdminFormProps = {
  action: string;
  title: string;
  submitLabel: string;
  categories: ArticleCategoryOption[];
  article?: ArticleFormValue;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
};

type SeoArticleDraft = {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
};

function isHttpImageUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim());
}

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart(
    "hour",
  )}:${getPart("minute")}`;
}

export function ArticleAdminForm({
  action,
  title,
  submitLabel,
  categories,
  article,
}: ArticleAdminFormProps) {
  const initialCoverImage = article?.coverImage ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImagePreview, setCoverImagePreview] = useState(initialCoverImage);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });
  const [draftMessage, setDraftMessage] = useState("");

  const setFieldValue = useCallback((name: string, value: string) => {
    const field = document.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(`[name="${name}"]`);

    if (field) {
      field.value = value;
    }
  }, []);

  useEffect(() => {
    if (article?.id) {
      return;
    }

    const rawDraft = window.localStorage.getItem("seoArticleDraft");
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as SeoArticleDraft;
      const fields: Array<keyof SeoArticleDraft> = [
        "title",
        "slug",
        "summary",
        "content",
        "seoTitle",
        "seoDescription",
      ];

      fields.forEach((field) => {
        if (typeof draft[field] === "string") {
          setFieldValue(field, draft[field] ?? "");
        }
      });

      window.localStorage.removeItem("seoArticleDraft");
      setDraftMessage("已从 SEO 文章生成器填入草稿内容，保存前可继续编辑。");
    } catch {
      window.localStorage.removeItem("seoArticleDraft");
    }
  }, [article?.id, setFieldValue]);

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadState({
        status: "error",
        message: "图片格式不支持，请上传 jpg、jpeg、png 或 webp。",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadState({
        status: "error",
        message: "图片超过大小限制，单张图片不能超过 5MB。",
      });
      return;
    }

    setUploadState({ status: "uploading", message: "上传中..." });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.url) {
        setUploadState({
          status: "error",
          message: result.error || "文章封面上传失败，请检查图片格式或 OSS 配置。",
        });
        return;
      }

      setFieldValue("coverImage", result.url);
      setCoverImagePreview(result.url);
      setUploadState({
        status: "success",
        message: "上传成功，保存文章后生效。",
      });
    } catch (error) {
      console.error("Article cover upload request failed", error);
      setUploadState({
        status: "error",
        message: "图片上传失败，请检查网络或 OSS 配置。",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function clearCoverImage() {
    setFieldValue("coverImage", "");
    setCoverImagePreview("");
    setUploadState({ status: "idle", message: "已清空封面图，保存文章后生效。" });
  }

  const showCoverPreview = isHttpImageUrl(coverImagePreview);

  return (
    <form action={action} method="post" className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {draftMessage ? (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              {draftMessage}
            </div>
          ) : null}

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
            <Label htmlFor="publishedAt">发布时间</Label>
            <Input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(article?.publishedAt)}
            />
            <p className="text-xs leading-5 text-slate-500">
              留空则立即发布；填写未来时间则到时间后自动显示。草稿文章不会在前台展示。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">文章封面图/占位图</Label>
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <Input
                id="coverImage"
                name="coverImage"
                defaultValue={initialCoverImage}
                placeholder="可手动填写图片 URL，也可以上传到 OSS"
                onChange={(event) => setCoverImagePreview(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadState.status === "uploading"}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadState.status === "uploading" ? "上传中..." : "上传图片"}
              </Button>
              <Button type="button" variant="outline" onClick={clearCoverImage}>
                清空图片
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleImageUpload(event.target.files?.[0])}
            />
            <p className="text-xs leading-5 text-slate-500">
              支持 jpg、jpeg、png、webp，单张不超过 5MB。上传成功后仍需点击保存文章。
            </p>
            {uploadState.message ? (
              <p
                className={
                  uploadState.status === "error"
                    ? "text-sm text-red-600"
                    : "text-sm text-teal-700"
                }
              >
                {uploadState.message}
              </p>
            ) : null}
            {showCoverPreview ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImagePreview}
                  alt="文章封面图预览"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}
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
              可使用简单 Markdown 风格标题，例如 ## 二级标题、### 三级标题、- 列表。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input
                id="seoTitle"
                name="seoTitle"
                defaultValue={article?.seoTitle ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
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
