export type SeoInternalLinkRule = {
  keywords: string[];
  url: string;
};

export const SEO_INTERNAL_LINK_RULES: SeoInternalLinkRule[] = [
  {
    keywords: [
      "TG账号购买",
      "Telegram账号购买",
      "TG账号",
      "Telegram账号",
      "飞机号",
      "纸飞机号",
      "电报号",
    ],
    url: "/tg",
  },
  {
    keywords: ["商品列表", "商品中心", "全部商品", "虚拟商品"],
    url: "/products",
  },
  {
    keywords: ["订单查询", "查询订单"],
    url: "/order/query",
  },
  {
    keywords: ["售后客服", "联系客服", "售后"],
    url: "/contact",
  },
  {
    keywords: ["账号教程", "购买教程", "使用教程", "SEO文章"],
    url: "/blog",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitInlineHeading(line: string) {
  const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

  if (!headingMatch) {
    return [line];
  }

  const [, marker, rawText] = headingMatch;
  const text = rawText.trim();
  const questionEnd = text.search(/[？?]/);

  if (questionEnd >= 0 && questionEnd < text.length - 1) {
    const title = text.slice(0, questionEnd + 1).trim();
    const rest = text.slice(questionEnd + 1).trim();

    return rest ? [`${marker} ${title}`, "", rest] : [`${marker} ${title}`];
  }

  const titleEndMatch = text.match(
    /^(.*?(?:开头说明|常见特点|常见问题|是什么|是什么意思|购买前需要注意什么|适合哪些使用场景|购买或使用前需要注意什么|相关入口))\s+(.+)$/,
  );

  if (titleEndMatch) {
    return [
      `${marker} ${titleEndMatch[1].trim()}`,
      "",
      titleEndMatch[2].trim(),
    ];
  }

  const paragraphStartMatch = text.match(
    /\s+(很多|这里|本文|本篇|这篇|可以理解|通常|建议|如果|购买|使用|下单|支付|订单|用户|好贸Go|群组偏|频道偏|Telegram\s+群组可以|Telegram\s+频道可以)/,
  );

  if (paragraphStartMatch?.index && paragraphStartMatch.index > 0) {
    const title = text.slice(0, paragraphStartMatch.index).trim();
    const rest = text.slice(paragraphStartMatch.index).trim();

    return rest ? [`${marker} ${title}`, "", rest] : [`${marker} ${title}`];
  }

  return [`${marker} ${text}`];
}

export function normalizeMarkdownContent(content: string) {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(#{2,3})\s+/g, "\n\n$1 ")
    .replace(/([^\n])\s+-\s+/g, "$1\n\n- ")
    .replace(/([^\n])\s+(\d+)[\.\、\)]\s+/g, "$1\n\n$2. ");

  return normalized
    .split("\n")
    .flatMap((line) => splitInlineHeading(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function linkKeywordInText(text: string, keyword: string, url: string) {
  const markdownLinkPattern = new RegExp(
    `\\[[^\\]]*${escapeRegExp(keyword)}[^\\]]*\\]\\([^\\)]+\\)`,
  );

  if (markdownLinkPattern.test(text)) {
    return { text, linked: false };
  }

  const segments = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  const keywordPattern = new RegExp(escapeRegExp(keyword));

  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index].startsWith("[") && segments[index].includes("](")) {
      continue;
    }

    if (keywordPattern.test(segments[index])) {
      segments[index] = segments[index].replace(
        keywordPattern,
        `[${keyword}](${url})`,
      );
      return { text: segments.join(""), linked: true };
    }
  }

  return { text, linked: false };
}

export function applySeoInternalLinks(content: string, maxLinks = 6) {
  let totalLinks = 0;
  const linkCountByUrl = new Map<string, number>();
  const sortedRules = SEO_INTERNAL_LINK_RULES.map((rule) => ({
    ...rule,
    keywords: [...rule.keywords].sort((a, b) => b.length - a.length),
  }));

  return content
    .split("\n")
    .map((line) => {
      if (!line.trim() || /^#{1,6}\s+/.test(line.trim())) {
        return line;
      }

      let nextLine = line;

      for (const rule of sortedRules) {
        if (totalLinks >= maxLinks) {
          break;
        }

        const urlCount = linkCountByUrl.get(rule.url) ?? 0;
        if (urlCount >= 2) {
          continue;
        }

        for (const keyword of rule.keywords) {
          if (totalLinks >= maxLinks) {
            break;
          }

          const result = linkKeywordInText(nextLine, keyword, rule.url);
          if (result.linked) {
            nextLine = result.text;
            totalLinks += 1;
            linkCountByUrl.set(rule.url, urlCount + 1);
            break;
          }
        }
      }

      return nextLine;
    })
    .join("\n");
}

export function normalizeAndLinkArticleContent(content: string) {
  return applySeoInternalLinks(normalizeMarkdownContent(content));
}

export function parseArticleTags(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[,，、\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function stringifyArticleTags(tags: string[]) {
  return parseArticleTags(tags.join(",")).join(",");
}
