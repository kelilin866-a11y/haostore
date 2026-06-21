export type SeoPlatformKey =
  | "telegram"
  | "twitter"
  | "instagram"
  | "apple-id"
  | "discord"
  | "gmail"
  | "hotmail"
  | "facebook"
  | "tiktok"
  | "custom";

export type SeoArticleType =
  | "definition"
  | "buying-guide"
  | "login-guide"
  | "faq"
  | "comparison"
  | "notice"
  | "after-sales";

export type SeoGeneratorInput = {
  platform: SeoPlatformKey;
  customPlatform?: string;
  keyword: string;
  articleType: SeoArticleType;
};

export type SeoArticleDraft = {
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
  faqText: string;
  internalLinksText: string;
};

export const SEO_PLATFORM_OPTIONS: Array<{
  value: SeoPlatformKey;
  label: string;
  slugPrefix: string;
  aliases: string[];
}> = [
  {
    value: "telegram",
    label: "TG / Telegram",
    slugPrefix: "telegram",
    aliases: ["TG账号", "Telegram账号", "飞机号", "电报号"],
  },
  {
    value: "twitter",
    label: "Twitter / X",
    slugPrefix: "twitter",
    aliases: ["Twitter账号", "X账号", "推特账号"],
  },
  {
    value: "instagram",
    label: "Instagram",
    slugPrefix: "instagram",
    aliases: ["Instagram账号", "Ins账号"],
  },
  {
    value: "apple-id",
    label: "Apple ID",
    slugPrefix: "apple-id",
    aliases: ["Apple ID", "苹果账号"],
  },
  {
    value: "discord",
    label: "Discord",
    slugPrefix: "discord",
    aliases: ["Discord账号", "DC账号"],
  },
  {
    value: "gmail",
    label: "Gmail",
    slugPrefix: "gmail",
    aliases: ["Gmail账号", "谷歌邮箱"],
  },
  {
    value: "hotmail",
    label: "Hotmail",
    slugPrefix: "hotmail",
    aliases: ["Hotmail账号", "Outlook邮箱"],
  },
  {
    value: "facebook",
    label: "Facebook",
    slugPrefix: "facebook",
    aliases: ["Facebook账号", "脸书账号"],
  },
  {
    value: "tiktok",
    label: "TikTok",
    slugPrefix: "tiktok",
    aliases: ["TikTok账号", "海外短视频账号"],
  },
  {
    value: "custom",
    label: "自定义平台",
    slugPrefix: "custom",
    aliases: ["虚拟商品账号"],
  },
];

export const SEO_ARTICLE_TYPE_OPTIONS: Array<{
  value: SeoArticleType;
  label: string;
  slugSuffix: string;
}> = [
  { value: "definition", label: "词义解释", slugSuffix: "meaning" },
  { value: "buying-guide", label: "购买指南", slugSuffix: "buying-guide" },
  { value: "login-guide", label: "登录教程", slugSuffix: "login-guide" },
  { value: "faq", label: "常见问题", slugSuffix: "faq" },
  { value: "comparison", label: "对比区别", slugSuffix: "comparison" },
  { value: "notice", label: "注意事项", slugSuffix: "notice" },
  { value: "after-sales", label: "售后说明", slugSuffix: "after-sales" },
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const normalized = cleanText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength);
}

function getPlatformMeta(platform: SeoPlatformKey, customPlatform?: string) {
  const meta =
    SEO_PLATFORM_OPTIONS.find((item) => item.value === platform) ??
    SEO_PLATFORM_OPTIONS[0];

  if (platform !== "custom") {
    return meta;
  }

  const label = cleanText(customPlatform || "虚拟商品");
  const slugPrefix =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom";

  return {
    ...meta,
    label,
    slugPrefix,
    aliases: [label],
  };
}

function buildSlug(keyword: string, platformSlug: string, typeSlug: string) {
  const keywordMap: Array<[RegExp, string]> = [
    [/tg|telegram|电报|飞机号|纸飞机/i, "telegram-account"],
    [/twitter|推特|x账号/i, "twitter-account"],
    [/instagram|ins/i, "instagram-account"],
    [/apple\s*id|苹果/i, "apple-id"],
    [/discord|dc/i, "discord-account"],
    [/gmail|谷歌邮箱/i, "gmail-account"],
    [/hotmail|outlook/i, "hotmail-account"],
    [/facebook|脸书/i, "facebook-account"],
    [/tiktok|抖音/i, "tiktok-account"],
    [/购买|买/i, "buy"],
    [/登录|登陆/i, "login"],
    [/注意/i, "notice"],
    [/售后/i, "after-sales"],
    [/区别|对比/i, "comparison"],
    [/是什么|什么意思|含义/i, "meaning"],
  ];
  const matched = keywordMap
    .filter(([pattern]) => pattern.test(keyword))
    .map(([, value]) => value);
  const parts = [platformSlug, ...matched, typeSlug]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
  const suffix = Math.random().toString(36).slice(2, 6);

  return `${parts.join("-")}-${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getArticleIntent(type: SeoArticleType) {
  switch (type) {
    case "definition":
      return "含义说明";
    case "buying-guide":
      return "购买指南";
    case "login-guide":
      return "登录教程";
    case "faq":
      return "常见问题";
    case "comparison":
      return "区别对比";
    case "notice":
      return "注意事项";
    case "after-sales":
      return "售后说明";
    default:
      return "使用说明";
  }
}

function getInternalLinks(platform: SeoPlatformKey) {
  const links = [
    platform === "telegram"
      ? "- TG专题页：/tg"
      : "- 商品列表页：/products",
    "- 全部商品：/products",
    "- 订单查询：/order/query",
    "- 售后客服：/contact",
  ];

  return Array.from(new Set(links)).join("\n");
}

export function generateSeoArticleDraft(
  input: SeoGeneratorInput,
): SeoArticleDraft {
  const keyword = cleanText(input.keyword) || "虚拟商品购买";
  const platform = getPlatformMeta(input.platform, input.customPlatform);
  const typeMeta =
    SEO_ARTICLE_TYPE_OPTIONS.find((item) => item.value === input.articleType) ??
    SEO_ARTICLE_TYPE_OPTIONS[0];
  const intent = getArticleIntent(input.articleType);
  const aliases = platform.aliases.slice(0, 3).join("、");
  const title = `${keyword}${intent === "含义说明" ? "是什么意思" : intent}`;
  const summary = `${keyword}围绕${platform.label}相关账号或资料的使用场景、购买前注意事项、订单查询和售后处理进行说明，适合购买前快速了解。`;
  const seoTitle = truncate(`${keyword}${intent} - 好贸Go`, 35);
  const seoDescription = truncate(
    `好贸Go整理${keyword}相关说明，覆盖${aliases}等常见叫法、使用场景、购买注意事项、订单查询和售后协助，帮助用户购买前更清楚。`,
    115,
  );
  const faqText = [
    `### ${keyword}适合哪些用户？`,
    `${keyword}适合需要了解${platform.label}账号资源、购买流程、登录使用和售后规则的用户。`,
    "",
    `### 购买${platform.aliases[0] ?? platform.label}前需要注意什么？`,
    "建议先确认商品规格、库存、发货格式和售后规则，购买后保留订单号和联系方式，方便后续查询或联系客服。",
    "",
    "### 购买后在哪里查看订单？",
    "可以进入订单查询页面，输入订单号或联系方式查看订单状态和发货内容。",
  ].join("\n");
  const internalLinksText = getInternalLinks(input.platform);
  const content = [
    `## ${keyword}简介`,
    `${keyword}是用户在了解${platform.label}相关资源时经常搜索的问题。本文会从含义、适用场景、购买前注意事项和售后处理几个角度说明，帮助你在下单前先确认需求。`,
    "",
    "## 适合哪些使用场景",
    "- 跨境沟通或社群运营前的信息了解",
    "- 多账号备用或工具测试前的购买准备",
    "- 账号登录、规格选择和售后规则确认",
    "- 购买前对平台账号常见叫法进行区分",
    "",
    "## 购买或使用前需要注意什么",
    "1. 先查看商品详情页中的规格、库存和发货说明。",
    "2. 下单时填写可联系到你的邮箱、Telegram、手机号或微信号。",
    "3. 支付完成后通过订单查询页面查看状态，不要重复付款。",
    "4. 收到发货内容后及时核对，如有异常请提供订单号联系客服。",
    "",
    "## 常见问题",
    faqText,
    "",
    "## 相关入口",
    "可以通过以下入口继续查看商品、订单和售后信息：",
    internalLinksText,
  ].join("\n");

  return {
    title,
    slug: buildSlug(keyword, platform.slugPrefix, typeMeta.slugSuffix),
    summary,
    seoTitle,
    seoDescription,
    content,
    faqText,
    internalLinksText,
  };
}
