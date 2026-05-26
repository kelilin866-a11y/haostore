export type Product = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  price: number;
  stock: number;
  specs: string[];
  notice: string[];
  deliveryFormat: string;
  afterSales: string;
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  imageAlt: string;
  sections: {
    heading: string;
    body: string;
    subheadings?: { heading: string; body: string }[];
  }[];
  faqs: { question: string; answer: string }[];
};

export const categories = [
  "全部",
  "Telegram",
  "Twitter/X",
  "Instagram",
  "Facebook",
  "Gmail",
  "教程资料",
];

export const products: Product[] = [
  {
    slug: "telegram-old-account",
    title: "Telegram 欧美老号",
    category: "Telegram",
    description: "适合基础登录测试与账号资料研究的文本类账号商品。",
    tags: ["欧美地区", "文本发货", "人工确认付款"],
    price: 39,
    stock: 126,
    specs: ["单个账号", "5 个账号包", "10 个账号包"],
    notice: ["请在购买前确认用途合规。", "发货内容为账号文本信息。", "第一阶段仅展示静态演示流程。"],
    deliveryFormat: "账号----密码----绑定邮箱----邮箱密码",
    afterSales: "如发货内容无法查看，请提供订单号联系客服核验。",
  },
  {
    slug: "twitter-email-verified-account",
    title: "X / Twitter 邮箱验证号",
    category: "Twitter/X",
    description: "邮箱验证账号演示商品，适合商城前台展示与下单流程占位。",
    tags: ["邮箱验证", "文本库存", "自动发货预留"],
    price: 45,
    stock: 88,
    specs: ["普通规格", "资料完善规格"],
    notice: ["购买后请及时保存发货内容。", "禁止用于违反平台规则的行为。"],
    deliveryFormat: "账号----密码----邮箱----邮箱密码----备注",
    afterSales: "仅支持发货内容缺失或格式异常的售后核验。",
  },
  {
    slug: "instagram-basic-account",
    title: "Instagram 普通账号",
    category: "Instagram",
    description: "Instagram 普通账号 mock 商品，用于第一阶段商品中心展示。",
    tags: ["普通账号", "库存充足", "演示商品"],
    price: 29,
    stock: 203,
    specs: ["单个账号", "批量 3 个演示包"],
    notice: ["请勿频繁切换设备登录。", "建议登录后先检查绑定信息。"],
    deliveryFormat: "账号----密码----辅助邮箱----备注",
    afterSales: "请在订单详情中保存发货内容，售后需提供订单号。",
  },
  {
    slug: "account-security-guide-pack",
    title: "账号登录与安全使用教程包",
    category: "教程资料",
    description: "面向新手的教程资料包，说明登录、保存信息和安全使用注意事项。",
    tags: ["教程资料", "新手指南", "PDF/文本"],
    price: 19,
    stock: 999,
    specs: ["教程包基础版", "教程包进阶版"],
    notice: ["教程仅作为基础资料参考。", "请结合平台官方规则使用。"],
    deliveryFormat: "教程下载地址----访问码----更新说明",
    afterSales: "资料链接失效时可凭订单号联系客服补发。",
  },
];

export const articles: Article[] = [
  {
    slug: "how-to-login-telegram-account",
    title: "Telegram账号怎么登录？新手完整图文教程",
    category: "Telegram",
    date: "2026-05-25",
    excerpt: "从准备环境、输入账号信息到保存安全资料，梳理 Telegram 账号登录的基础步骤。",
    keyword: "Telegram账号怎么登录",
    metaTitle: "Telegram账号怎么登录？新手完整图文教程",
    metaDescription: "面向新手的 Telegram 账号登录教程，说明登录准备、验证码、资料保存和常见问题。",
    canonical: "/blog/how-to-login-telegram-account",
    imageAlt: "Telegram账号登录教程流程图占位图",
    sections: [
      {
        heading: "登录前需要准备什么",
        body: "登录前请先确认账号、密码、绑定邮箱和订单发货内容完整可读。建议在稳定网络环境下操作，并提前保存订单号。",
        subheadings: [
          {
            heading: "检查发货格式",
            body: "常见格式会包含账号、密码、邮箱和邮箱密码。不同商品可能包含备注字段，请按商品详情页说明识别。",
          },
        ],
      },
      {
        heading: "基础登录步骤",
        body: "打开 Telegram 客户端后，根据页面提示输入账号信息。如果需要邮箱或其他验证，请使用发货内容中的对应信息完成验证。",
      },
      {
        heading: "登录后如何保存资料",
        body: "建议将订单号、账号信息和客服联系方式保存在本地安全位置。遇到内容异常时，联系客服时请提供订单号。",
      },
    ],
    faqs: [
      {
        question: "登录失败一定是账号问题吗？",
        answer: "不一定。网络、设备环境、输入错误或验证码超时都可能导致失败。",
      },
      {
        question: "需要注册商城账号才能查询订单吗？",
        answer: "不需要。本项目目标是使用订单号加联系方式查询。",
      },
    ],
  },
  {
    slug: "instagram-account-after-buying",
    title: "Instagram账号购买后需要注意什么？",
    category: "Instagram",
    date: "2026-05-25",
    excerpt: "说明购买后保存资料、首次登录、风险控制和售后沟通的基础注意事项。",
    keyword: "Instagram账号购买注意事项",
    metaTitle: "Instagram账号购买后需要注意什么？",
    metaDescription: "了解 Instagram 账号购买后的资料保存、登录检查、使用边界和售后联系要点。",
    canonical: "/blog/instagram-account-after-buying",
    imageAlt: "Instagram账号购买后注意事项占位图",
    sections: [
      {
        heading: "第一时间保存发货内容",
        body: "收到发货内容后，请先保存订单号和账号文本，避免刷新页面或更换设备后找不到信息。",
      },
      {
        heading: "首次登录建议",
        body: "首次登录应保持操作稳定，不要短时间内频繁修改资料或切换设备。",
      },
      {
        heading: "售后沟通方式",
        body: "如果发货内容缺失或格式异常，请通过订单号联系 Telegram 或邮箱客服。",
      },
    ],
    faqs: [
      {
        question: "购买后可以更换联系方式吗？",
        answer: "第一阶段仅做静态演示，正式业务中会以订单记录为准。",
      },
      {
        question: "是否支持评价功能？",
        answer: "当前项目需求明确不做评价功能。",
      },
    ],
  },
  {
    slug: "how-to-query-order",
    title: "虚拟账号自动发货商城如何查询订单？",
    category: "订单查询",
    date: "2026-05-25",
    excerpt: "介绍通过订单号和联系方式查询订单、查看支付状态与发货内容的预期流程。",
    keyword: "自动发货商城查询订单",
    metaTitle: "虚拟账号自动发货商城如何查询订单？",
    metaDescription: "了解虚拟商品商城的订单查询方式，包括订单号、联系方式、支付状态和发货内容。",
    canonical: "/blog/how-to-query-order",
    imageAlt: "虚拟商品商城订单查询页面占位图",
    sections: [
      {
        heading: "查询订单需要哪些信息",
        body: "本项目规划使用订单号和下单联系方式查询订单，不需要用户注册或登录账号。",
      },
      {
        heading: "可以查询到什么内容",
        body: "订单详情会展示商品名称、数量、支付状态、发货状态和文本发货内容。",
      },
      {
        heading: "付款如何确认",
        body: "第一版采用后台人工确认付款，管理员确认后系统再从文本库存分配发货内容。",
      },
    ],
    faqs: [
      {
        question: "现在是否接入真实支付？",
        answer: "第一阶段不接入真实支付，只保留后续支付网关扩展空间。",
      },
      {
        question: "查询订单需要登录吗？",
        answer: "不需要。目标流程是订单号加联系方式查询。",
      },
    ],
  },
];

export const mockOrder = {
  orderNo: "VG202605250001",
  productName: "Telegram 欧美老号",
  quantity: 2,
  paymentStatus: "待人工确认",
  deliveryStatus: "演示已发货",
  customerService: "Telegram: @demo_service / Email: support@example.com",
  deliveryItems: [
    "tg_demo_001----Pass@2026----mail001@example.com----MailPass001",
    "tg_demo_002----Pass@2026----mail002@example.com----MailPass002",
  ],
};
