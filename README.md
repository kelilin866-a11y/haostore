# 虚拟商品自动发货商城

一个“虚拟商品自动发货商城”的基础项目。当前已经完成前台页面骨架、数据库模型、商品数据库读取、下单流程、后台人工确认付款、自动发货和订单查询闭环。

项目目标是建设一个无登录、无购物车的虚拟商品商城，销售账号类、卡密类和教程类文本商品。第一版支付采用后台人工确认，后续阶段管理员确认付款后，系统再从文本库存中分配发货内容。

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
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
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
- 后台入口：http://localhost:3000/admin
- 后台登录：http://localhost:3000/admin/login
- 后台订单：http://localhost:3000/admin/orders
- 健康检查：http://localhost:3000/api/health

## 环境变量

复制 `.env.example` 为 `.env` 后填写：

```env
DATABASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
AI_PROVIDER=
AI_API_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_NAME=
MANUAL_PAYMENT_NOTICE=
CUSTOMER_SERVICE_TELEGRAM=
CUSTOMER_SERVICE_EMAIL=
PAYMENT_PROVIDER=stripe
PAYMENT_CURRENCY=cny
NEXT_PUBLIC_PAYMENT_GATEWAY_NAME="Stripe Checkout"
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

PostgreSQL 示例：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/virtual_goods_shop?schema=public"
```

## Prisma 命令

生成 Prisma Client：

```bash
npm run prisma:generate
```

校验 schema：

```bash
npx prisma validate
```

运行 migration：

```bash
npm run prisma:migrate
```

写入 seed 数据：

```bash
npm run prisma:seed
```

Seed 仅用于本地开发和测试环境，会清空并重建分类、商品、规格、库存、文章和设置等基础数据。不要在生产数据库执行 seed；脚本在 `NODE_ENV=production` 时会拒绝运行。

重置数据库：

```bash
npm run db:reset
```

如果本地暂时没有真实 PostgreSQL 数据库，可以先只运行 `npx prisma validate` 和 `npm run prisma:generate`。

## 当前阶段完成内容

第一阶段已完成：

- 创建 Next.js + TypeScript 项目结构。
- 集成 Tailwind CSS。
- 添加 shadcn/ui 风格基础组件。
- 创建首页、产品中心、商品详情、订单查询、订单成功、文章列表、文章详情、客服、服务条款、售后政策和后台占位页面。
- 创建 `/api/health` 健康检查接口。
- 使用 `lib/mock-data.ts` 提供前台 mock 数据。

第二阶段已完成：

- 更新 Prisma schema，添加商品、规格、库存、订单、支付记录、发货记录、文章和站点设置模型。
- 添加 ProductStatus、VariantStatus、InventoryStatus、PaymentStatus、DeliveryStatus、OrderStatus、ArticleStatus、PaymentMethod 枚举。
- 添加 slug、sku、orderNo、setting key 等唯一约束。
- 添加库存和订单状态相关索引。
- 创建 `prisma/seed.ts`，提供分类、商品、规格、库存、文章分类、文章和 Setting seed 数据。
- 创建 `lib/db.ts`，在 Next.js dev 环境中复用 PrismaClient。

第三阶段已完成：

- `/products` 从数据库读取 active 商品、分类、规格和可用库存数量。
- `/products/[slug]` 从数据库读取商品详情、active 规格、价格和库存。
- 商品详情页提供基础下单表单：规格、数量、联系方式和人工支付方式。
- 新增 `POST /api/orders`，创建 `pending` 支付状态、`pending` 发货状态、`pending_payment` 订单状态的订单。
- 新增 `/order/[orderNo]/pay` 人工支付说明页，展示订单信息、付款说明和客服联系方式。
- 第三阶段订单不会扣减库存，不会创建发货内容，不会自动发货。

第四阶段已完成：

- `/order/query` 支持使用订单号和联系方式查询真实订单。
- 新增 `POST /api/orders/query`，未发货订单不返回发货内容，已发货订单返回发货内容。
- 第四阶段新增 `/admin/orders` 简单后台订单页，当时使用 URL token 做基础保护。
- 新增 `POST /api/admin/orders/confirm`，管理员人工确认付款后，在事务中扣减库存、创建发货记录并完成订单。
- `/order/[orderNo]/pay` 在订单已发货后展示发货内容，未发货时仍只展示人工付款说明。
- 本阶段仍不接入真实支付，不做用户注册，不做复杂后台权限系统。

第五阶段已完成：

- 新增 Stripe Checkout 在线支付入口，使用现有 `gateway_reserved` 支付方式。
- 新增 `POST /api/payments/checkout`，为在线支付订单创建 Checkout Session。
- 新增 `POST /api/payments/stripe/webhook`，校验 Stripe webhook 签名后处理支付成功事件。
- 支付成功后只通过 webhook 将订单支付状态更新为 `paid`，不自动扣减库存、不自动创建 DeliveryItem。
- 发货仍保留第四阶段后台人工确认流程，由管理员确认后再扣减库存并分配发货内容。
- 人工付款、后台确认付款、订单查询和发货内容展示逻辑保持可用。

后台权限系统阶段已完成：

- 新增 `/admin/login` 后台登录页。
- 新增 `POST /api/admin/login` 和 `POST /api/admin/logout`。
- 使用 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 配置后台登录。
- 登录成功后写入 httpOnly cookie session。
- `/admin`、`/admin/orders` 和 `POST /api/admin/orders/confirm` 改为校验后台 session。
- `/admin/orders` 不再依赖 URL token，未登录访问会跳转到 `/admin/login`。
- 后台人工确认发货逻辑保持不变，仍由管理员点击按钮后扣库存并创建 DeliveryItem。

### 后台登录配置

`.env` 中配置：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-string
```

后台登录入口：

```bash
http://localhost:3000/admin/login
```

### Stripe 支付配置

`.env` 中配置：

```env
PAYMENT_PROVIDER=stripe
PAYMENT_CURRENCY=cny
NEXT_PUBLIC_PAYMENT_GATEWAY_NAME="Stripe Checkout"
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

本地调试 webhook 时，需要把 Stripe 事件转发到：

```bash
http://localhost:3000/api/payments/stripe/webhook
```

未配置 `STRIPE_SECRET_KEY` 或 `STRIPE_WEBHOOK_SECRET` 时，人工付款流程仍然可用，在线支付按钮会提示支付网关未配置。

## 当前阶段限制

- 不实现用户注册。
- 不实现购物车。
- 不实现完整后台业务。
- 不新增前台用户登录、会员、批发价、阶梯价。
- 不做用户注册、会员系统或复杂 RBAC。

## 下一阶段开发计划

下一阶段建议做支付异常处理、退款/人工复核流程、后台审计日志和部署前安全加固。
