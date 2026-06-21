import { redirect } from "next/navigation";

import { SeoArticleGenerator } from "@/components/site/SeoArticleGenerator";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminSeoGeneratorPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/seo-generator");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          SEO文章生成器
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          按平台、关键词和文章类型生成 SEO 文章草稿。第一版为本地模板生成器，不调用 AI
          API，生成后可复制或填入新增文章表单继续编辑。
        </p>
      </div>

      <SeoArticleGenerator />
    </div>
  );
}
