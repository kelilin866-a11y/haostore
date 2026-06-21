import { ArticleStatus, type Prisma } from "@prisma/client";

export function getVisiblePublishedArticleWhere(
  now = new Date(),
): Prisma.ArticleWhereInput {
  return {
    status: ArticleStatus.published,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

export function getArticlePublishState(
  status: ArticleStatus | string,
  publishedAt: Date | null,
  now = new Date(),
) {
  if (status === ArticleStatus.archived) {
    return {
      label: "已归档",
      badgeVariant: "outline" as const,
    };
  }

  if (status !== ArticleStatus.published) {
    return {
      label: "草稿",
      badgeVariant: "warning" as const,
    };
  }

  if (publishedAt && publishedAt.getTime() > now.getTime()) {
    return {
      label: "定时发布",
      badgeVariant: "warning" as const,
    };
  }

  return {
    label: "已发布",
    badgeVariant: "success" as const,
  };
}
