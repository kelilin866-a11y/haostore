type ProductAutoFillInput = {
  title: string;
  categoryName?: string;
  categorySlug?: string;
  summary?: string;
  deliveryType?: string;
};

const keywordMap: Array<[RegExp, string]> = [
  [/telegram|电报|tg/i, "telegram"],
  [/twitter|推特|\bx\b/i, "twitter"],
  [/instagram|ins|\big\b/i, "instagram"],
  [/facebook|\bfb\b/i, "facebook"],
  [/gmail|google/i, "gmail"],
  [/discord/i, "discord"],
  [/美国|欧美|usa?|\bus\b/i, "us"],
  [/api/i, "api"],
  [/链接|link/i, "link"],
  [/账号|账户|帐号|号/i, "account"],
  [/老号/i, "old-account"],
  [/邮箱|mail|email/i, "email"],
  [/验证/i, "verified"],
  [/教程|资料|教学/i, "tutorial"],
  [/库存/i, "stock"],
  [/文本|卡密/i, "text"],
  [/(\d+)\s*[-到至]\s*(\d+)\s*年/i, "$1-$2y"],
];

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  return parts.filter((part) => {
    if (!part || seen.has(part)) {
      return false;
    }
    seen.add(part);
    return true;
  });
}

function shortCode() {
  return Math.random().toString(36).slice(2, 7);
}

export function generateProductSlug({
  title,
  categoryName,
  categorySlug,
}: ProductAutoFillInput) {
  const parts: string[] = [];
  const normalizedCategory = normalizeSlug(categorySlug || categoryName || "");

  if (normalizedCategory) {
    parts.push(normalizedCategory);
  }

  for (const [pattern, replacement] of keywordMap) {
    if (pattern.test(title)) {
      parts.push(normalizeSlug(title.replace(pattern, replacement)));
    }
  }

  const directSlug = normalizeSlug(title);
  if (directSlug) {
    parts.push(directSlug);
  }

  const slug = uniqueParts(parts.join("-").split("-")).slice(0, 8).join("-");
  return slug || `product-${shortCode()}`;
}

export function generateProductSeoTitle({
  title,
  categoryName,
}: ProductAutoFillInput) {
  const base = [title, categoryName].filter(Boolean).join(" - ");
  const seoTitle = `${base || "虚拟商品"}购买 / 自动发货 / 虚拟商品`;
  return seoTitle.length > 60 ? `${seoTitle.slice(0, 57)}...` : seoTitle;
}

export function generateProductSeoDescription({
  title,
  categoryName,
  summary,
}: ProductAutoFillInput) {
  const intro = summary || `${title} 属于${categoryName || "虚拟商品"}分类`;
  const description = `${intro}。支持在线下单与 Stripe Checkout 支付，库存以页面展示为准。支付成功后由系统确认付款状态，后台管理员再进行人工发货；购买前请阅读商品说明和售后规则。`;

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157)}...`;
}

export function generateProductDescriptionTemplate({
  deliveryType,
}: ProductAutoFillInput) {
  const isInventoryDelivery = /库存|inventory|stock/i.test(deliveryType || "");

  if (isInventoryDelivery) {
    return `【商品说明】
本商品为库存发货类虚拟商品，库存数量以页面显示为准。

【发货说明】
支付成功后，系统确认付款状态，后台管理员确认后从库存中分配发货内容。

【售后说明】
请在收到内容后及时检查，如有异常请提供订单号和联系方式联系客服。`;
  }

  return `【商品说明】
本商品为虚拟文本类商品，购买后请按页面提示完成支付。

【发货说明】
支付成功后，订单会进入待发货状态，由后台管理员确认后发货。

【售后说明】
请在购买后及时检查内容，如有问题请提供订单号和联系方式联系客服。`;
}
