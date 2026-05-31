import { ArticleStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

import { getPublishedAt, redirectTo, requireAdmin } from "../../article-form";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  const authRedirect = requireAdmin(request);
  if (authRedirect) {
    return authRedirect;
  }

  const formData = await request.formData();
  const status =
    formData.get("status") === ArticleStatus.published
      ? ArticleStatus.published
      : ArticleStatus.draft;

  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { publishedAt: true },
  });

  await prisma.article.update({
    where: {
      id: params.id,
    },
    data: {
      status,
      publishedAt: getPublishedAt(status, article?.publishedAt),
    },
  });

  return redirectTo("/admin/articles");
}
