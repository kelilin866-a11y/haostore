import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ArticleCardValue = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  keyword?: string | null;
  tags?: string[];
};

export function ArticleCard({ article }: { article: ArticleCardValue }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{article.category}</Badge>
          <span className="text-xs text-slate-500">{article.date}</span>
        </div>
        <CardTitle className="leading-6">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm leading-6 text-slate-500">{article.excerpt}</p>
        {article.tags && article.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:border-teal-200 hover:text-deal"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : article.keyword ? (
          <p className="text-xs text-slate-500">
            目标关键词：<span className="text-primary">{article.keyword}</span>
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/blog/${article.slug}`}>查看文章</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
