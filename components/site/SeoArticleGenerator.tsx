"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateSeoArticleDraft,
  SEO_ARTICLE_TYPE_OPTIONS,
  SEO_PLATFORM_OPTIONS,
  type SeoArticleDraft,
  type SeoArticleType,
  type SeoPlatformKey,
} from "@/lib/seo-article-generator";

function buildCopyText(draft: SeoArticleDraft) {
  return [
    `文章标题：${draft.title}`,
    `slug：${draft.slug}`,
    `摘要：${draft.summary}`,
    `SEO标题：${draft.seoTitle}`,
    `SEO描述：${draft.seoDescription}`,
    "",
    "正文内容：",
    draft.content,
  ].join("\n");
}

export function SeoArticleGenerator() {
  const [platform, setPlatform] = useState<SeoPlatformKey>("telegram");
  const [customPlatform, setCustomPlatform] = useState("");
  const [keyword, setKeyword] = useState("TG账号购买");
  const [articleType, setArticleType] =
    useState<SeoArticleType>("buying-guide");
  const [draft, setDraft] = useState<SeoArticleDraft>(() =>
    generateSeoArticleDraft({
      platform: "telegram",
      keyword: "TG账号购买",
      articleType: "buying-guide",
    }),
  );
  const [message, setMessage] = useState("");

  function handleGenerate() {
    if (!keyword.trim()) {
      setMessage("请先输入目标关键词。");
      return;
    }

    setDraft(
      generateSeoArticleDraft({
        platform,
        customPlatform,
        keyword,
        articleType,
      }),
    );
    setMessage("已生成文章草稿，可复制或填入新增文章表单。");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyText(draft));
      setMessage("已复制全部生成内容。");
    } catch {
      setMessage("复制失败，请手动选择右侧内容复制。");
    }
  }

  function handleFillArticleForm() {
    window.localStorage.setItem(
      "seoArticleDraft",
      JSON.stringify({
        title: draft.title,
        slug: draft.slug,
        summary: draft.summary,
        content: draft.content,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
      }),
    );
    window.location.href = "/admin/articles/new";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>生成条件</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform">平台选择</Label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as SeoPlatformKey)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            >
              {SEO_PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {platform === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor="customPlatform">自定义平台</Label>
              <Input
                id="customPlatform"
                value={customPlatform}
                onChange={(event) => setCustomPlatform(event.target.value)}
                placeholder="例如：Amazon、Snapchat、邮箱账户"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="keyword">关键词</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="例如：飞机号是什么意思、Apple ID购买注意事项"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleType">文章类型</Label>
            <select
              id="articleType"
              value={articleType}
              onChange={(event) =>
                setArticleType(event.target.value as SeoArticleType)
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            >
              {SEO_ARTICLE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" variant="deal" onClick={handleGenerate}>
            生成文章草稿
          </Button>

          <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-6 text-slate-600">
            第一版为本地模板生成器，不调用 AI API。生成内容用于教程、购买指南和售后说明，不包含违规承诺。
          </div>

          {message ? (
            <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
              {message}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>文章标题</Label>
              <Input value={draft.title} readOnly />
            </div>
            <div className="space-y-2">
              <Label>slug</Label>
              <Input value={draft.slug} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label>摘要</Label>
            <textarea
              value={draft.summary}
              readOnly
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SEO标题</Label>
              <Input value={draft.seoTitle} readOnly />
            </div>
            <div className="space-y-2">
              <Label>SEO描述</Label>
              <textarea
                value={draft.seoDescription}
                readOnly
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>正文内容 Markdown 模板</Label>
            <textarea
              value={draft.content}
              readOnly
              rows={18}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>FAQ 模块</Label>
              <textarea
                value={draft.faqText}
                readOnly
                rows={8}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>内链建议</Label>
              <textarea
                value={draft.internalLinksText}
                readOnly
                rows={8}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleCopy}>
              复制全部内容
            </Button>
            <Button type="button" variant="deal" onClick={handleFillArticleForm}>
              填入新增文章表单
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
