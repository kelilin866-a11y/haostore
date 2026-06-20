import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/constants";

type SettingGroup =
  | "basic"
  | "home_hero"
  | "home"
  | "products"
  | "order_query"
  | "contact"
  | "policy";

type EditableSettingField = {
  key: string;
  label: string;
  description: string;
  inputType: "input" | "textarea";
  group: SettingGroup;
  envKey?: string;
  fallback: string;
  rows?: number;
};

const defaultTermsContent = `【商品性质】
本商城展示的商品为虚拟文本类商品，包括账号类、卡密类和教程资料。购买前请确认商品说明、规格、库存和售后范围。

【用户责任】
用户应自行确认购买需求和使用场景，并遵守相关平台规则、法律法规和服务条款。

【禁止用途】
禁止将商品用于违法违规、欺诈、骚扰、垃圾信息或侵犯第三方权益的用途。

【支付说明】
当前支持 Stripe Checkout 在线支付。支付成功后系统通过 Stripe webhook 自动确认付款状态，发货仍由后台管理员人工确认。

【售后说明】
如发货内容缺失或格式异常，请提供订单号和联系方式联系客服核验。`;

const defaultAfterSalesContent = `【售后条件】
发货内容缺失、格式明显异常或订单信息无法查看时，可凭订单号联系客服核验。

【不支持售后的情况】
因用户违规用途、未保存发货内容、错误操作或超出说明范围造成的问题，原则上不支持售后。

【联系客服方式】
请通过页面展示的 Telegram 或邮箱联系客服。

【需要提供订单号】
售后沟通时请提供订单号、下单联系方式、商品名称和问题说明。`;

export const settingGroups: Array<{ key: SettingGroup; title: string }> = [
  { key: "basic", title: "基础配置" },
  { key: "home_hero", title: "首页 Hero 配置" },
  { key: "home", title: "首页配置" },
  { key: "products", title: "产品配置" },
  { key: "order_query", title: "订单查询配置" },
  { key: "contact", title: "联系客服配置" },
  { key: "policy", title: "政策/售后配置" },
];

export const editableSettingFields = [
  {
    key: "site_name",
    label: "站点名称",
    description: "显示在 Logo、页脚和默认 SEO 标题中的站点名称。",
    inputType: "input",
    group: "basic",
    envKey: "NEXT_PUBLIC_SITE_NAME",
    fallback: siteConfig.name,
  },
  {
    key: "customer_service_telegram",
    label: "Telegram 客服",
    description: "前台联系页、页脚和订单支付页展示的 Telegram 客服。",
    inputType: "input",
    group: "basic",
    envKey: "CUSTOMER_SERVICE_TELEGRAM",
    fallback: siteConfig.customerTelegram,
  },
  {
    key: "customer_service_email",
    label: "邮箱客服",
    description: "前台联系页、页脚和订单支付页展示的邮箱客服。",
    inputType: "input",
    group: "basic",
    envKey: "CUSTOMER_SERVICE_EMAIL",
    fallback: siteConfig.customerEmail,
  },
  {
    key: "default_seo_title",
    label: "默认 SEO 标题",
    description: "未设置单页 SEO 标题时使用的全站默认标题。",
    inputType: "input",
    group: "basic",
    envKey: "DEFAULT_SEO_TITLE",
    fallback: siteConfig.defaultSeoTitle,
  },
  {
    key: "default_seo_description",
    label: "默认 SEO 描述",
    description: "未设置单页 SEO 描述时使用的全站默认描述。",
    inputType: "textarea",
    group: "basic",
    envKey: "DEFAULT_SEO_DESCRIPTION",
    fallback: siteConfig.defaultSeoDescription,
  },
  {
    key: "payment_notice",
    label: "付款页支付说明",
    description: "订单支付页展示的支付与发货状态说明。",
    inputType: "textarea",
    group: "basic",
    envKey: "MANUAL_PAYMENT_NOTICE",
    fallback: siteConfig.paymentNotice,
  },
  {
    key: "footer_description",
    label: "页脚站点说明",
    description: "首页底部和全站页脚展示的站点说明。",
    inputType: "textarea",
    group: "basic",
    envKey: "FOOTER_DESCRIPTION",
    fallback: siteConfig.description,
  },
  {
    key: "after_sales_notice",
    label: "默认售后说明",
    description: "商品未单独设置售后说明时使用。",
    inputType: "textarea",
    group: "basic",
    envKey: "AFTER_SALES_NOTICE",
    fallback: siteConfig.afterSalesNotice,
  },
  {
    key: "product_default_notice",
    label: "商品默认注意事项",
    description: "商品未单独设置注意事项时使用，支持多行。",
    inputType: "textarea",
    group: "basic",
    envKey: "PRODUCT_DEFAULT_NOTICE",
    fallback: siteConfig.productDefaultNotice,
  },
  {
    key: "product_default_delivery",
    label: "商品默认发货说明",
    description: "商品未单独设置发货说明时使用。",
    inputType: "textarea",
    group: "basic",
    envKey: "PRODUCT_DEFAULT_DELIVERY",
    fallback: siteConfig.productDefaultDelivery,
  },
  {
    key: "home_hero_badge",
    label: "首页顶部标签文案",
    description: "首页 Hero 区顶部的小标签。",
    inputType: "input",
    group: "home",
    fallback: "Stripe Checkout + 后台人工发货",
  },
  {
    key: "home_hero_title",
    label: "首页 Hero 主标题",
    description: "首页 Hero 区主标题。",
    inputType: "input",
    group: "home_hero",
    fallback: "购买属于你的高质量产品",
  },
  {
    key: "home_hero_description",
    label: "首页 Hero 描述文案",
    description: "首页 Hero 区介绍文案。",
    inputType: "textarea",
    group: "home_hero",
    fallback:
      "精选账号类、卡密类和教程资料，支持在线下单，支付后由后台确认发货，购买流程清晰可查。",
  },
  {
    key: "home_hero_primary_button_text",
    label: "首页 Hero 主按钮文字",
    description: "首页 Hero 区主按钮展示文案。",
    inputType: "input",
    group: "home_hero",
    fallback: "查看商品",
  },
  {
    key: "home_hero_primary_button_href",
    label: "首页 Hero 主按钮链接",
    description: "首页 Hero 区主按钮跳转链接，例如 /products。",
    inputType: "input",
    group: "home_hero",
    fallback: "/products",
  },
  {
    key: "home_hero_secondary_button_text",
    label: "首页 Hero 次按钮文字",
    description: "首页 Hero 区次按钮展示文案。",
    inputType: "input",
    group: "home_hero",
    fallback: "查询订单",
  },
  {
    key: "home_hero_secondary_button_href",
    label: "首页 Hero 次按钮链接",
    description: "首页 Hero 区次按钮跳转链接，例如 /order/query。",
    inputType: "input",
    group: "home_hero",
    fallback: "/order/query",
  },
  {
    key: "home_primary_button_text",
    label: "首页主按钮文案",
    description: "首页 Hero 区主按钮。",
    inputType: "input",
    group: "home",
    fallback: "进入产品中心",
  },
  {
    key: "home_secondary_button_text",
    label: "首页次按钮文案",
    description: "首页 Hero 区次按钮。",
    inputType: "input",
    group: "home",
    fallback: "查询订单",
  },
  {
    key: "home_feature_1",
    label: "首页右侧卖点 1",
    description: "首页 Hero 区右侧卖点。",
    inputType: "input",
    group: "home",
    fallback: "Stripe Checkout 在线支付",
  },
  {
    key: "home_feature_2",
    label: "首页右侧卖点 2",
    description: "首页 Hero 区右侧卖点。",
    inputType: "input",
    group: "home",
    fallback: "后台人工确认发货",
  },
  {
    key: "home_feature_3",
    label: "首页右侧卖点 3",
    description: "首页 Hero 区右侧卖点。",
    inputType: "input",
    group: "home",
    fallback: "订单号 + 联系方式查询",
  },
  {
    key: "home_feature_4",
    label: "首页右侧卖点 4",
    description: "首页 Hero 区右侧卖点。",
    inputType: "input",
    group: "home",
    fallback: "SEO 文章后台管理",
  },
  {
    key: "home_purchase_step_1_title",
    label: "购买流程 1 标题",
    description: "首页购买流程第一步标题。",
    inputType: "input",
    group: "home",
    fallback: "选择商品",
  },
  {
    key: "home_purchase_step_1_description",
    label: "购买流程 1 描述",
    description: "首页购买流程第一步描述。",
    inputType: "textarea",
    group: "home",
    fallback: "浏览账号类、卡密类和教程类文本商品，查看价格、库存和发货格式。",
  },
  {
    key: "home_purchase_step_2_title",
    label: "购买流程 2 标题",
    description: "首页购买流程第二步标题。",
    inputType: "input",
    group: "home",
    fallback: "填写联系方式",
  },
  {
    key: "home_purchase_step_2_description",
    label: "购买流程 2 描述",
    description: "首页购买流程第二步描述。",
    inputType: "textarea",
    group: "home",
    fallback: "无需注册、无需购物车，在商品详情页直接下单并留下联系方式。",
  },
  {
    key: "home_purchase_step_3_title",
    label: "购买流程 3 标题",
    description: "首页购买流程第三步标题。",
    inputType: "input",
    group: "home",
    fallback: "确认支付",
  },
  {
    key: "home_purchase_step_3_description",
    label: "购买流程 3 描述",
    description: "首页购买流程第三步描述。",
    inputType: "textarea",
    group: "home",
    fallback: "支持 Stripe Checkout 在线支付，支付成功后系统通过 Stripe webhook 自动确认付款状态。",
  },
  {
    key: "home_purchase_step_4_title",
    label: "购买流程 4 标题",
    description: "首页购买流程第四步标题。",
    inputType: "input",
    group: "home",
    fallback: "确认发货",
  },
  {
    key: "home_purchase_step_4_description",
    label: "购买流程 4 描述",
    description: "首页购买流程第四步描述。",
    inputType: "textarea",
    group: "home",
    fallback: "发货仍由后台管理员人工确认，支付成功前不会展示任何发货内容。",
  },
  {
    key: "products_page_title",
    label: "产品中心标题",
    description: "产品中心页面主标题。",
    inputType: "input",
    group: "products",
    fallback: "虚拟商品列表",
  },
  {
    key: "products_page_description",
    label: "产品中心说明",
    description: "产品中心页面介绍文案。",
    inputType: "textarea",
    group: "products",
    fallback:
      "当前商品从数据库读取。支持 Stripe Checkout 在线支付，支付成功后系统通过 webhook 自动确认付款状态，发货仍由后台管理员人工确认。",
  },
  {
    key: "product_card_buy_button_text",
    label: "商品卡片购买按钮文案",
    description: "首页和产品中心商品卡片按钮文案。",
    inputType: "input",
    group: "products",
    fallback: "立即购买",
  },
  {
    key: "product_empty_text",
    label: "无商品提示文案",
    description: "产品中心无商品时展示的提示。",
    inputType: "textarea",
    group: "products",
    fallback: "暂无可售商品。请稍后再查看商品列表。",
  },
  {
    key: "product_detail_notice_title",
    label: "商品详情注意事项标题",
    description: "商品详情页注意事项模块标题。",
    inputType: "input",
    group: "products",
    fallback: "注意事项",
  },
  {
    key: "product_detail_delivery_title",
    label: "商品详情发货标题",
    description: "商品详情页发货格式标题。",
    inputType: "input",
    group: "products",
    fallback: "发货格式",
  },
  {
    key: "product_detail_after_sales_title",
    label: "商品详情售后标题",
    description: "商品详情页售后说明标题。",
    inputType: "input",
    group: "products",
    fallback: "售后说明",
  },
  {
    key: "product_detail_payment_notice",
    label: "商品详情支付提示",
    description: "商品详情页商品说明下方的支付和发货提示。",
    inputType: "textarea",
    group: "products",
    fallback:
      "支持 Stripe Checkout 在线支付。支付成功后，系统会通过支付回调确认付款状态。发货仍由后台管理员人工确认，确认前不会展示任何发货内容。",
  },
  {
    key: "order_query_page_title",
    label: "订单查询页面标题",
    description: "订单查询页主标题。",
    inputType: "input",
    group: "order_query",
    fallback: "通过订单号或联系方式查询",
  },
  {
    key: "order_query_page_description",
    label: "订单查询页面说明",
    description: "订单查询页介绍文案。",
    inputType: "textarea",
    group: "order_query",
    fallback:
      "可以只输入订单号，也可以只输入下单联系方式。联系方式匹配到多个订单时，会显示全部结果。",
  },
  {
    key: "order_query_input_placeholder",
    label: "联系方式输入框占位文案",
    description: "订单查询表单联系方式输入框 placeholder。",
    inputType: "input",
    group: "order_query",
    fallback: "下单时填写的联系方式",
  },
  {
    key: "order_query_button_text",
    label: "订单查询按钮文案",
    description: "订单查询表单按钮文案。",
    inputType: "input",
    group: "order_query",
    fallback: "查询",
  },
  {
    key: "order_query_help_text",
    label: "订单查询帮助文案",
    description: "订单查询表单下方帮助文案。",
    inputType: "textarea",
    group: "order_query",
    fallback: "未发货订单不会展示发货内容；已发货订单会展示对应文本内容。",
  },
  {
    key: "contact_page_title",
    label: "联系客服页面标题",
    description: "联系页主标题。",
    inputType: "input",
    group: "contact",
    fallback: "售前与售后支持",
  },
  {
    key: "contact_page_description",
    label: "联系客服页面说明",
    description: "联系页介绍文案。",
    inputType: "textarea",
    group: "contact",
    fallback: "有问题请提供订单号联系客服，便于快速核验订单和发货内容。",
  },
  {
    key: "contact_telegram_label",
    label: "Telegram 客服标题",
    description: "联系页 Telegram 卡片标题。",
    inputType: "input",
    group: "contact",
    fallback: "Telegram 客服",
  },
  {
    key: "contact_email_label",
    label: "邮箱客服标题",
    description: "联系页邮箱卡片标题。",
    inputType: "input",
    group: "contact",
    fallback: "邮箱客服",
  },
  {
    key: "contact_notice",
    label: "联系客服提示",
    description: "联系页客服卡片内的统一提示。",
    inputType: "textarea",
    group: "contact",
    fallback: "咨询商品或售后问题时，请说明商品名称、订单号和遇到的问题。",
  },
  {
    key: "footer_quick_links_title",
    label: "页脚快捷入口标题",
    description: "页脚快捷入口模块标题。",
    inputType: "input",
    group: "policy",
    fallback: "快捷入口",
  },
  {
    key: "footer_policy_title",
    label: "页脚政策标题",
    description: "页脚政策说明模块标题。",
    inputType: "input",
    group: "policy",
    fallback: "政策说明",
  },
  {
    key: "terms_page_title",
    label: "服务条款页面标题",
    description: "服务条款页主标题。",
    inputType: "input",
    group: "policy",
    fallback: "服务条款",
  },
  {
    key: "terms_page_content",
    label: "服务条款页面内容",
    description: "服务条款页正文，支持多段文本。",
    inputType: "textarea",
    group: "policy",
    fallback: defaultTermsContent,
    rows: 10,
  },
  {
    key: "after_sales_page_title",
    label: "售后政策页面标题",
    description: "售后政策页主标题。",
    inputType: "input",
    group: "policy",
    fallback: "售后政策",
  },
  {
    key: "after_sales_page_content",
    label: "售后政策页面内容",
    description: "售后政策页正文，支持多段文本。",
    inputType: "textarea",
    group: "policy",
    fallback: defaultAfterSalesContent,
    rows: 10,
  },
] as const satisfies readonly EditableSettingField[];

export type EditableSettingKey = (typeof editableSettingFields)[number]["key"];

export type SiteSettings = Record<EditableSettingKey, string>;

const legacySettingKeys: Partial<Record<EditableSettingKey, string[]>> = {
  customer_service_telegram: ["customer_telegram"],
  customer_service_email: ["customer_email"],
  home_purchase_step_1_title: ["purchase_step_1_title"],
  home_purchase_step_1_description: ["purchase_step_1_description"],
  home_purchase_step_2_title: ["purchase_step_2_title"],
  home_purchase_step_2_description: ["purchase_step_2_description"],
  home_purchase_step_3_title: ["purchase_step_3_title"],
  home_purchase_step_3_description: ["purchase_step_3_description"],
  home_purchase_step_4_title: ["purchase_step_4_title"],
  home_purchase_step_4_description: ["purchase_step_4_description"],
};

function getEnvFallback(field: EditableSettingField) {
  const envKey = field.envKey ?? field.key.toUpperCase();

  return process.env[envKey] || field.fallback;
}

const settingFallbacks = editableSettingFields.reduce((fallbacks, field) => {
  fallbacks[field.key] = getEnvFallback(field);
  return fallbacks;
}, {} as SiteSettings);

export async function getSiteSettings(): Promise<SiteSettings> {
  const keys = editableSettingFields.map((field) => field.key);
  const legacyKeys = Object.values(legacySettingKeys).flat();

  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: [...keys, ...legacyKeys],
        },
      },
    });
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return editableSettingFields.reduce((settings, field) => {
      const legacyValue = legacySettingKeys[field.key]
        ?.map((key) => map.get(key))
        .find((value): value is string => Boolean(value));

      settings[field.key] =
        map.get(field.key) || legacyValue || settingFallbacks[field.key];
      return settings;
    }, {} as SiteSettings);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[site-settings] Failed to load settings", error);
    }
    return settingFallbacks;
  }
}

export function getSettingFallback(key: EditableSettingKey) {
  return settingFallbacks[key];
}
