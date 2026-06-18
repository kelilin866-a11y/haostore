import type { MetadataRoute } from "next";
import { ArticleStatus, ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://haomaogo.com").replace(
  /\/$/,
  "",
);

function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function staticEntry(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    staticEntry("/", 1, "daily"),
    staticEntry("/products", 0.9, "daily"),
    staticEntry("/blog", 0.7, "weekly"),
    staticEntry("/order/query", 0.5, "monthly"),
    staticEntry("/policy/after-sales", 0.4, "monthly"),
    staticEntry("/policy/terms", 0.4, "monthly"),
    staticEntry("/contact", 0.5, "monthly"),
  ];

  try {
    const [products, articles] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: ProductStatus.active,
          slug: {
            not: "",
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.article.findMany({
        where: {
          status: ArticleStatus.published,
          slug: {
            not: "",
          },
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
      url: absoluteUrl(`/blog/${encodeURIComponent(article.slug)}`),
      lastModified: article.publishedAt ?? article.updatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

    return [...staticPages, ...productPages, ...articlePages];
  } catch (error) {
    console.error("[sitemap] Failed to load dynamic sitemap entries", error);
    return staticPages;
  }
}
