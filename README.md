# 虚拟商品自动发货商城

一个“虚拟商品自动发货商城”的基础项目。当前已经完成前台页面骨架、数据库模型、商品数据库读取、下单流程、Stripe Checkout 在线支付、后台人工确认发货和订单查询闭环。

项目目标是建设一个无登录、无购物车的虚拟商品商城，销售账号类、卡密类和教程类文本商品。当前支持 Stripe Checkout 在线支付，支付成功后系统通过 Stripe webhook 自动确认付款状态，发货仍由后台管理员人工确认。

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
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=change-me-to-a-long-random-secret
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
- 商品详情页提供基础下单表单：规格、数量、联系方式和 Stripe Checkout 在线支付方式。
- 新增 `POST /api/orders`，创建 `pending` 支付状态、`pending` 发货状态、`pending_payment` 订单状态的订单。
- 新增 `/order/[orderNo]/pay` 支付说明页，展示订单信息、Stripe Checkout 入口和客服联系方式。
- 第三阶段订单不会扣减库存，不会创建发货内容，不会自动发货。

第四阶段已完成：

- `/order/query` 支持使用订单号和联系方式查询真实订单。
- 新增 `POST /api/orders/query`，未发货订单不返回发货内容，已发货订单返回发货内容。
- 第四阶段新增 `/admin/orders` 简单后台订单页，当时使用 URL token 做基础保护。
- 新增 `POST /api/admin/orders/confirm`，后台管理员确认发货后，在事务中扣减库存、创建发货记录并完成订单。
- `/order/[orderNo]/pay` 在订单已发货后展示发货内容，未发货时只展示支付状态和发货等待说明。
- 本阶段当时未接入真实支付；当前版本已接入 Stripe Checkout，仍不做用户注册，不做复杂后台权限系统。

第五阶段已完成：

- 新增 Stripe Checkout 在线支付入口，使用现有 `gateway_reserved` 支付方式。
- 新增 `POST /api/payments/checkout`，为在线支付订单创建 Checkout Session。
- 新增 `POST /api/payments/stripe/webhook`，校验 Stripe webhook 签名后处理支付成功事件。
- 支付成功后只通过 webhook 将订单支付状态更新为 `paid`，不自动扣减库存、不自动创建 DeliveryItem。
- 发货仍保留第四阶段后台人工确认流程，由管理员确认后再扣减库存并分配发货内容。
- Stripe Checkout、后台人工确认发货、订单查询和发货内容展示逻辑保持可用。

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
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=change-me-to-a-long-random-secret
```

后台登录入口：

```bash
http://localhost:3000/admin/login
```

访问 `/admin/login` 后，使用 `.env` 中的 `ADMIN_USERNAME` 和
`ADMIN_PASSWORD` 登录后台。生产环境请替换示例密码和 session secret。

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

未配置 `STRIPE_SECRET_KEY` 时，订单待支付页会提示在线支付配置暂不可用；配置 Stripe 后才显示 Stripe Checkout 支付入口。

修改 `.env` 中的支付环境变量后，需要重启 `npm run dev`，Next.js 才会重新读取服务端环境变量。

## 当前阶段限制

- 不实现用户注册。
- 不实现购物车。
- 不实现完整后台业务。
- 不新增前台用户登录、会员、批发价、阶梯价。
- 不做用户注册、会员系统或复杂 RBAC。

## 下一阶段开发计划

下一阶段建议做支付异常处理、退款/人工复核流程、后台审计日志和部署前安全加固。

## 部署前检查

上线前请确认：

- `DATABASE_URL` 指向生产 PostgreSQL 数据库。
- `NEXT_PUBLIC_SITE_URL` 是完整生产域名，例如 `https://example.com`，Stripe Checkout 的返回地址会使用它。
- `PAYMENT_PROVIDER=stripe`、`PAYMENT_CURRENCY=cny`、`NEXT_PUBLIC_PAYMENT_GATEWAY_NAME="Stripe Checkout"` 已配置。
- `STRIPE_SECRET_KEY` 使用当前环境对应的 Stripe secret key。
- `STRIPE_WEBHOOK_SECRET` 使用 Stripe Dashboard 中 webhook endpoint 的签名密钥，不要把本地 Stripe CLI 的 secret 用到生产环境。
- `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 已替换为生产强凭据。
- 所有真实密钥只能配置在部署平台环境变量中，不要提交到 Git。

推荐服务器部署命令：

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
npm run start
```

Vercel / Railway 等平台通常使用构建命令：

```bash
npm run build
```

上线前需要先对生产数据库执行迁移：

```bash
npm run prisma:migrate
```

Stripe webhook 配置步骤：

1. 在 Stripe Dashboard 创建 webhook endpoint：
   `https://your-domain.com/api/payments/stripe/webhook`
2. 至少订阅这些事件：
   `checkout.session.completed`、
   `checkout.session.async_payment_succeeded`、
   `checkout.session.async_payment_failed`、
   `checkout.session.expired`、
   `payment_intent.succeeded`
3. 将 endpoint signing secret 配置到 `STRIPE_WEBHOOK_SECRET`。
4. 完成一笔 Stripe 测试支付，确认订单变为 `paymentStatus=paid`，且 `deliveryStatus` 仍为 `pending`。

支付与发货边界：

- Stripe webhook 只确认付款状态并写入 `PaymentRecord`。
- Stripe webhook 不扣库存、不创建 `DeliveryItem`、不把订单改为 completed。
- 只有管理员登录后台并在 `/admin/orders` 确认发货后，才会扣库存、创建发货内容并完成订单。
- 订单查询页只在 `deliveryStatus=delivered` 后展示发货内容。

生产数据安全：

- 不要在生产数据库执行 `npm run prisma:seed`。seed 脚本会清空并重建演示分类、商品、库存、文章、订单、支付记录和设置。
- 不要在生产数据库执行 `npm run db:reset`。它会重置数据库。
- `prisma/seed.ts` 和 `lib/mock-data.ts` 中的示例库存、示例账号、示例文章只用于本地开发测试，不能作为生产真实库存。
