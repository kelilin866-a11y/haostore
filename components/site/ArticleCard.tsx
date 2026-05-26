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
import { type Article } from "@/lib/mock-data";

export function ArticleCard({ article }: { article: Article }) {
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
        <p className="text-xs text-slate-500">
          目标关键词：<span className="text-primary">{article.keyword}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/blog/${article.slug}`}>查看文章</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
