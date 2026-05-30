# 分阶段开发计划与范围边界

## 项目定位

本项目定位为虚拟商品商城，销售账号类、卡密类和教程类文本商品。

当前版本主链路：

商品浏览 -> 下单 -> Stripe Checkout 在线支付 -> Stripe webhook 确认付款 -> 后台人工确认发货 -> 用户订单查询。

当前版本能力：

- 前台商品和规格展示。
- 游客免注册、免登录直接下单。
- Stripe Checkout 在线支付。
- Stripe webhook 签名校验和付款状态确认。
- 后台商品管理。
- 后台 SEO 文章管理。
- 后台订单管理和人工确认发货。
- 用户订单查询。

## 明确不做

以下能力不在当前版本范围内，也不作为后续阶段规划：

- 用户注册/登录。
- 会员中心。
- 购物车。
- 优惠券。
- 阶梯价、批发价、会员价。
- 自动发货。
- 邮件通知。
- 复杂内容运营系统。

## 发货与支付边界

- Stripe Checkout 只负责在线支付入口。
- Stripe webhook 只负责确认付款状态和写入 `PaymentRecord`。
- Stripe webhook 不扣库存、不创建 `DeliveryItem`、不把订单改为 completed。
- 只有后台管理员人工确认发货后，才会扣库存、创建发货内容并完成订单。
- 未发货订单在前台查询和支付页都不会展示库存文本内容。

## 阶段 1：项目初始化 + 前台基础页面

- 初始化 Next.js + TypeScript + App Router。
- 集成 Tailwind CSS 和 shadcn/ui 风格基础组件。
- 预留 Prisma + PostgreSQL 配置。
- 创建首页、产品中心、商品详情、订单查询、订单成功、文章、客服、政策和后台占位页面。
- 使用 mock 数据完成第一版页面展示。

状态：已完成。

## 阶段 2：数据库模型 + seed 数据

- 设计 AdminUser、Category、Product、ProductVariant、InventoryItem、Order、OrderItem、DeliveryItem、PaymentRecord、ArticleCategory、Article、Setting 模型。
- 添加商品、库存、订单、支付、发货、文章状态枚举。
- 配置 Prisma Client、PostgreSQL datasource、索引和唯一约束。
- 创建基础 seed 数据。

状态：已完成。

## 阶段 3：商品读取 + 下单流程

- 从数据库读取商品和库存状态。
- 商品详情页提供真实规格、数量和联系方式表单。
- 创建待支付订单，但不扣减库存，不创建发货内容。
- 创建 `/order/[orderNo]/pay` 订单支付页。

状态：已完成。

## 阶段 4：订单查询 + 后台人工确认发货

- 实现订单查询闭环。
- 已发货订单展示发货内容，未发货订单不泄露库存内容。
- 后台管理员人工确认发货，在事务中扣减库存、创建 DeliveryItem 并完成订单。

状态：已完成。

## 阶段 5：Stripe Checkout 支付接入

- 新增 Stripe Checkout 支付入口。
- 新增 Checkout Session 创建接口。
- 新增 Stripe webhook 回调接口，校验签名后更新支付状态。
- 在线支付成功后不自动发货，仍由后台人工确认后再扣减库存并创建 DeliveryItem。

状态：已完成。

## 阶段 6：后台权限系统

- 新增 `/admin/login` 后台登录页。
- 使用 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 配置后台账号和 session 签名密钥。
- 登录成功后写入 httpOnly cookie session。
- 后台页面和后台操作 API 校验后台登录状态。

状态：已完成。

## 阶段 7：后台商品管理

- 新增 `/admin/products` 后台商品管理。
- 支持查看、新增、编辑商品。
- 支持商品上架/下架。
- 支持规格名称、sku、价格、库存文本和启用状态管理。
- 前台产品中心和商品详情读取数据库商品，不以 mock 数据作为主数据源。

状态：已完成。

## 阶段 8：后台 SEO 文章管理

- 新增 `/admin/articles` 后台 SEO 文章管理。
- 支持查看、新增、编辑文章。
- 支持文章发布/下架。
- 支持标题、slug、摘要、正文、SEO 标题和 SEO 描述。
- 前台 `/blog` 和 `/blog/[slug]` 只展示已发布数据库文章。

状态：已完成。

## 阶段 9：上线前验收与部署准备

- 检查环境变量、Stripe webhook、Prisma 迁移、构建命令和生产部署说明。
- 清理生产可见页面中的阶段性文案。
- 确认首页、产品中心、文章列表均读取数据库内容。
- 确认支付与发货边界不混淆。

状态：已完成。

## 后续维护方向

后续只围绕稳定性、部署和运营文档做小步维护：

- Stripe webhook 日志和异常排查。
- 后台操作审计记录。
- 生产环境备份、监控和部署文档。
- 商品、库存和 SEO 文章内容维护。

不扩展用户注册、前台登录、会员中心、购物车、优惠券、阶梯价、自动发货、邮件通知或复杂内容运营系统。
