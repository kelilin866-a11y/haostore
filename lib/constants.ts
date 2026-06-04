const defaultSiteName = "虚拟商品商城";
const defaultSeoDescription =
  "支持 Stripe Checkout 在线支付、Stripe webhook 确认付款和后台人工确认发货的虚拟商品商城";
const defaultPaymentNotice =
  "支持 Stripe Checkout 在线支付。支付成功后系统通过 Stripe webhook 自动确认付款状态。发货仍由后台管理员人工确认，支付成功前不会展示任何发货内容。若支付状态暂未更新，请稍后刷新或通过订单查询查看。";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || defaultSiteName,
  description: process.env.FOOTER_DESCRIPTION || defaultSeoDescription,
  defaultSeoTitle:
    process.env.DEFAULT_SEO_TITLE ||
    process.env.NEXT_PUBLIC_SITE_NAME ||
    defaultSiteName,
  defaultSeoDescription:
    process.env.DEFAULT_SEO_DESCRIPTION || defaultSeoDescription,
  customerTelegram:
    process.env.CUSTOMER_SERVICE_TELEGRAM || "请配置客服 Telegram",
  customerEmail: process.env.CUSTOMER_SERVICE_EMAIL || "请配置客服邮箱",
  paymentNotice: process.env.MANUAL_PAYMENT_NOTICE || defaultPaymentNotice,
  afterSalesNotice:
    process.env.AFTER_SALES_NOTICE ||
    "如有问题，请提供订单号联系客服核验。",
  productDefaultNotice:
    process.env.PRODUCT_DEFAULT_NOTICE ||
    "请在购买前确认用途合规。\n支付状态确认后，发货仍由后台管理员人工确认。",
  productDefaultDelivery:
    process.env.PRODUCT_DEFAULT_DELIVERY || "账号----密码----备注",
};

export const statusLabels = {
  paid: "已付款",
  pending: "待支付确认",
  delivered: "已发货",
};
