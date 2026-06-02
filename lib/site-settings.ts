import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/constants";

export const editableSettingFields = [
  {
    key: "site_name",
    label: "站点名称",
    description: "显示在 Logo、页脚和默认 SEO 标题中的站点名称。",
    inputType: "input",
  },
  {
    key: "customer_service_telegram",
    label: "Telegram 客服",
    description: "前台联系页面、页脚和订单支付页展示的 Telegram 客服。",
    inputType: "input",
  },
  {
    key: "customer_service_email",
    label: "邮箱客服",
    description: "前台联系页面、页脚和订单支付页展示的邮箱客服。",
    inputType: "input",
  },
  {
    key: "default_seo_title",
    label: "默认 SEO 标题",
    description: "未设置单页 SEO 标题时使用的全站默认标题。",
    inputType: "input",
  },
  {
    key: "default_seo_description",
    label: "默认 SEO 描述",
    description: "未设置单页 SEO 描述时使用的全站默认描述。",
    inputType: "textarea",
  },
  {
    key: "payment_notice",
    label: "付款页支付说明",
    description: "订单支付页展示的支付与发货状态说明。",
    inputType: "textarea",
  },
  {
    key: "footer_description",
    label: "页脚站点说明",
    description: "首页底部和全站页脚展示的站点说明。",
    inputType: "textarea",
  },
  {
    key: "after_sales_notice",
    label: "默认售后说明",
    description: "商品未单独设置售后说明时使用。",
    inputType: "textarea",
  },
  {
    key: "product_default_notice",
    label: "商品默认注意事项",
    description: "商品未单独设置注意事项时使用，支持多行。",
    inputType: "textarea",
  },
  {
    key: "product_default_delivery",
    label: "商品默认发货说明",
    description: "商品未单独设置发货说明时使用。",
    inputType: "textarea",
  },
] as const;

export type EditableSettingKey = (typeof editableSettingFields)[number]["key"];

export type SiteSettings = Record<EditableSettingKey, string>;

const settingFallbacks: SiteSettings = {
  site_name: siteConfig.name,
  customer_service_telegram: siteConfig.customerTelegram,
  customer_service_email: siteConfig.customerEmail,
  default_seo_title: siteConfig.defaultSeoTitle,
  default_seo_description: siteConfig.defaultSeoDescription,
  payment_notice: siteConfig.paymentNotice,
  footer_description: siteConfig.description,
  after_sales_notice: siteConfig.afterSalesNotice,
  product_default_notice: siteConfig.productDefaultNotice,
  product_default_delivery: siteConfig.productDefaultDelivery,
};

const legacySettingKeys: Partial<Record<EditableSettingKey, string[]>> = {
  customer_service_telegram: ["customer_telegram"],
  customer_service_email: ["customer_email"],
};

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
