import { ArticleCard } from "@/components/site/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { articles } from "@/lib/mock-data";

const articleCategories = ["全部", "Telegram", "Instagram", "订单查询", "安全使用"];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">SEO 文章</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">文章列表</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          为后续 SEO 文章系统和 AI 辅助生成草稿预留内容结构。
        </p>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {articleCategories.map((category, index) => (
          <Badge key={category} variant={index === 0 ? "deal" : "outline"} className="px-3 py-1">
            {category}
          </Badge>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
