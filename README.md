# 虚拟商品自动发货商城

一个“虚拟商品自动发货商城”的第一阶段基础项目。当前版本聚焦项目初始化和前台页面骨架，使用 mock 数据展示账号类、卡密类和教程类文本商品的浏览、详情、订单查询、发货结果和 SEO 文章页面。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Prisma
- PostgreSQL
- ESLint

## 本地启动

```bash
npm install
npm run dev
```

启动后访问：

- 首页：http://localhost:3000
- 产品中心：http://localhost:3000/products
- 商品详情：http://localhost:3000/products/telegram-old-account
- 订单查询：http://localhost:3000/order/query
- 发货结果：http://localhost:3000/order/success
- 文章列表：http://localhost:3000/blog
- 文章详情：http://localhost:3000/blog/how-to-login-telegram-account
- 联系客服：http://localhost:3000/contact
- 后台占位：http://localhost:3000/admin
- 健康检查：http://localhost:3000/api/health

## 环境变量

复制 `.env.example` 为 `.env` 后按需填写：

```env
DATABASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
AI_PROVIDER=
AI_API_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_NAME=
```

第一阶段只预留 Prisma + PostgreSQL 配置，不要求连接真实数据库。

## 当前阶段完成内容

- 创建 Next.js + TypeScript 项目结构。
- 集成 Tailwind CSS。
- 添加 shadcn/ui 风格基础组件。
- 预留 Prisma PostgreSQL datasource 和 Prisma Client generator。
- 创建首页、产品中心、商品详情、订单查询、订单成功、文章列表、文章详情、客服、服务条款、售后政策和后台占位页面。
- 创建 `/api/health` 健康检查接口。
- 使用 `lib/mock-data.ts` 提供 categories、products、articles 和 mockOrder。
- UI 采用深蓝、青绿色、辅助蓝和浅灰白风格。

## 下一阶段开发计划

下一阶段建议进入“阶段 2：数据库模型 + seed 数据”，设计商品、库存、订单、文章和站点设置模型，并建立 Prisma migration 与 seed 脚本。

## 当前阶段限制

- 不接入真实支付。
- 不实现用户注册。
- 不实现购物车。
- 不实现复杂后台业务。
- 不写入真实订单或库存。
