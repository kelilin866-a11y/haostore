import {
  ArticleStatus,
  InventoryStatus,
  PrismaClient,
  ProductStatus,
  VariantStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run seed in production");
}

const categorySeed = [
  { name: "Telegram", slug: "telegram", description: "Telegram 账号类虚拟商品", sortOrder: 10 },
  { name: "Twitter/X", slug: "twitter-x", description: "X / Twitter 账号类虚拟商品", sortOrder: 20 },
  { name: "Instagram", slug: "instagram", description: "Instagram 账号类虚拟商品", sortOrder: 30 },
  { name: "Facebook", slug: "facebook", description: "Facebook 账号类虚拟商品", sortOrder: 40 },
  { name: "Gmail", slug: "gmail", description: "Gmail 邮箱类虚拟商品", sortOrder: 50 },
  { name: "教程资料", slug: "guides", description: "教程资料和文本资料包", sortOrder: 60 },
];

const productSeed = [
  {
    categorySlug: "telegram",
    title: "Telegram 欧美老号",
    slug: "telegram-old-account",
    summary: "适合基础登录测试与账号资料研究的文本类账号商品。",
    description: "Telegram 欧美老号演示商品，后续阶段由文本库存自动分配发货内容。",
    deliveryFormat: "账号----密码----绑定邮箱----邮箱密码",
    price: "39.00",
    variants: [
      { name: "单个账号", sku: "TG-OLD-SINGLE", price: "39.00", stockDisplay: 3 },
      { name: "5 个账号包", sku: "TG-OLD-PACK5", price: "185.00", stockDisplay: 3 },
    ],
    inventory: [
      "tg_seed_001----Pass@2026----mail001@example.com----MailPass001",
      "tg_seed_002----Pass@2026----mail002@example.com----MailPass002",
      "tg_seed_003----Pass@2026----mail003@example.com----MailPass003",
      "tg_seed_004----Pass@2026----mail004@example.com----MailPass004",
      "tg_seed_005----Pass@2026----mail005@example.com----MailPass005",
    ],
  },
  {
    categorySlug: "twitter-x",
    title: "X / Twitter 邮箱验证号",
    slug: "twitter-email-verified-account",
    summary: "邮箱验证账号演示商品，适合前台展示与后续下单流程。",
    description: "X / Twitter 邮箱验证号，库存以文本形式保存。",
    deliveryFormat: "账号----密码----邮箱----邮箱密码----备注",
    price: "45.00",
    variants: [
      { name: "普通规格", sku: "X-MAIL-NORMAL", price: "45.00", stockDisplay: 3 },
      { name: "资料完善规格", sku: "X-MAIL-PROFILE", price: "59.00", stockDisplay: 3 },
    ],
    inventory: [
      "x_seed_001----Pass@2026----xmail001@example.com----MailPass001",
      "x_seed_002----Pass@2026----xmail002@example.com----MailPass002",
      "x_seed_003----Pass@2026----xmail003@example.com----MailPass003",
      "x_seed_004----Pass@2026----xmail004@example.com----MailPass004",
      "x_seed_005----Pass@2026----xmail005@example.com----MailPass005",
    ],
  },
  {
    categorySlug: "instagram",
    title: "Instagram 普通账号",
    slug: "instagram-basic-account",
    summary: "Instagram 普通账号 mock 商品，用于前台和数据库 seed。",
    description: "Instagram 普通账号库存示例，内容为文本发货格式。",
    deliveryFormat: "账号----密码----辅助邮箱----备注",
    price: "29.00",
    variants: [
      { name: "单个账号", sku: "IG-BASIC-SINGLE", price: "29.00", stockDisplay: 3 },
      { name: "3 个账号包", sku: "IG-BASIC-PACK3", price: "82.00", stockDisplay: 3 },
    ],
    inventory: [
      "ig_seed_001----Pass@2026----igmail001@example.com----note001",
      "ig_seed_002----Pass@2026----igmail002@example.com----note002",
      "ig_seed_003----Pass@2026----igmail003@example.com----note003",
      "ig_seed_004----Pass@2026----igmail004@example.com----note004",
      "ig_seed_005----Pass@2026----igmail005@example.com----note005",
    ],
  },
  {
    categorySlug: "guides",
    title: "账号登录与安全使用教程包",
    slug: "account-security-guide-pack",
    summary: "面向新手的登录和安全使用教程资料包。",
    description: "教程资料包以文本链接和访问码形式发货。",
    deliveryFormat: "教程下载地址----访问码----更新说明",
    price: "19.00",
    variants: [
      { name: "教程包基础版", sku: "GUIDE-BASIC", price: "19.00", stockDisplay: 2 },
      { name: "教程包进阶版", sku: "GUIDE-PRO", price: "39.00", stockDisplay: 2 },
    ],
    inventory: [
      "https://example.com/guide/basic----GUIDE2026A----基础版资料",
      "https://example.com/guide/pro----GUIDE2026B----进阶版资料",
    ],
  },
];

const articleCategorySeed = [
  { name: "登录教程", slug: "login-guides", description: "账号登录相关教程", sortOrder: 10 },
  { name: "使用教程", slug: "usage-guides", description: "账号使用和安全注意事项", sortOrder: 20 },
  { name: "常见问题", slug: "faq", description: "订单、售后和常见问题", sortOrder: 30 },
];

async function main() {
  await prisma.deliveryItem.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.article.deleteMany();
  await prisma.articleCategory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();

  const categories = new Map<string, string>();
  for (const category of categorySeed) {
    const created = await prisma.category.create({ data: category });
    categories.set(category.slug, created.id);
  }

  const productIds = new Map<string, string>();
  for (const product of productSeed) {
    const categoryId = categories.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for ${product.title}`);
    }

    const createdProduct = await prisma.product.create({
      data: {
        categoryId,
        title: product.title,
        slug: product.slug,
        summary: product.summary,
        description: product.description,
        status: ProductStatus.active,
        seoTitle: product.title,
        seoDescription: product.summary,
        seoKeywords: `${product.title},虚拟商品,自动发货`,
        notice: "请保存订单号和发货内容，售后时需提供订单号。",
        deliveryFormat: product.deliveryFormat,
        afterSales: "发货内容缺失或格式异常时，请提供订单号联系客服核验。",
      },
    });
    productIds.set(product.slug, createdProduct.id);

    for (let index = 0; index < product.variants.length; index += 1) {
      const variant = product.variants[index];
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stockDisplay: variant.stockDisplay,
          status: VariantStatus.active,
          sortOrder: index + 1,
        },
      });

      await prisma.inventoryItem.createMany({
        data: product.inventory
          .slice(0, variant.stockDisplay)
          .map((content, inventoryIndex) => ({
            productId: createdProduct.id,
            variantId: createdVariant.id,
            content: `${content}----${variant.sku}-${inventoryIndex + 1}`,
            status: InventoryStatus.available,
          })),
      });
    }
  }

  const articleCategories = new Map<string, string>();
  for (const category of articleCategorySeed) {
    const created = await prisma.articleCategory.create({ data: category });
    articleCategories.set(category.slug, created.id);
  }

  await prisma.article.createMany({
    data: [
      {
        categoryId: articleCategories.get("login-guides")!,
        title: "Telegram账号怎么登录？新手完整图文教程",
        slug: "how-to-login-telegram-account",
        summary: "从准备环境、输入账号信息到保存安全资料，梳理 Telegram 账号登录的基础步骤。",
        content: "## 登录前准备\n请先确认账号、密码、绑定邮箱和订单发货内容完整可读。\n\n## 基础登录步骤\n打开客户端，根据提示输入账号信息并完成必要验证。\n\n## 常见问题\n如遇异常，请保留订单号联系客服。",
        status: ArticleStatus.published,
        seoTitle: "Telegram账号怎么登录？新手完整图文教程",
        seoDescription: "面向新手的 Telegram 账号登录教程，说明登录准备、验证码、资料保存和常见问题。",
        seoKeywords: "Telegram账号怎么登录,Telegram登录教程",
        canonical: "/blog/how-to-login-telegram-account",
        faqJson: [
          { question: "需要注册商城账号吗？", answer: "不需要，订单查询使用订单号和联系方式。" },
        ],
        relatedProductIds: [productIds.get("telegram-old-account")!],
        publishedAt: new Date(),
      },
      {
        categoryId: articleCategories.get("usage-guides")!,
        title: "Instagram账号购买后需要注意什么？",
        slug: "instagram-account-after-buying",
        summary: "说明购买后保存资料、首次登录、风险控制和售后沟通的基础注意事项。",
        content: "## 保存资料\n购买后请保存订单号和发货文本。\n\n## 首次登录\n保持网络和设备稳定，避免短时间频繁切换。\n\n## 售后沟通\n发货内容异常时请提供订单号。",
        status: ArticleStatus.published,
        seoTitle: "Instagram账号购买后需要注意什么？",
        seoDescription: "了解 Instagram 账号购买后的资料保存、登录检查、使用边界和售后联系要点。",
        seoKeywords: "Instagram账号购买注意事项",
        canonical: "/blog/instagram-account-after-buying",
        faqJson: [
          { question: "是否支持评价功能？", answer: "当前项目需求明确不做评价功能。" },
        ],
        relatedProductIds: [productIds.get("instagram-basic-account")!],
        publishedAt: new Date(),
      },
      {
        categoryId: articleCategories.get("faq")!,
        title: "虚拟账号自动发货商城如何查询订单？",
        slug: "how-to-query-order",
        summary: "介绍通过订单号和联系方式查询订单、查看支付状态与发货内容的预期流程。",
        content: "## 查询信息\n后续阶段将通过订单号和联系方式查询。\n\n## 查询内容\n订单详情会展示支付状态、发货状态和发货内容。\n\n## 当前阶段\n第二阶段只建立数据模型和 seed 数据。",
        status: ArticleStatus.published,
        seoTitle: "虚拟账号自动发货商城如何查询订单？",
        seoDescription: "了解虚拟商品商城的订单查询方式，包括订单号、联系方式、支付状态和发货内容。",
        seoKeywords: "自动发货商城查询订单",
        canonical: "/blog/how-to-query-order",
        faqJson: [
          { question: "现在是否接入真实支付？", answer: "没有，当前仍不接入真实支付。" },
        ],
        relatedProductIds: [productIds.get("telegram-old-account")!],
        publishedAt: new Date(),
      },
    ],
  });

  await prisma.setting.createMany({
    data: [
      { key: "site_name", value: "虚拟商品自动发货商城" },
      { key: "customer_telegram", value: "@demo_service" },
      { key: "customer_email", value: "support@example.com" },
      { key: "payment_notice", value: "第一版采用后台人工确认付款，暂不接入真实支付网关。" },
      { key: "after_sales_notice", value: "售后请提供订单号、联系方式和问题说明。" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
