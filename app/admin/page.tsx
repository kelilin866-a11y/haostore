import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Boxes,
  CreditCard,
  FolderTree,
  FileText,
  Newspaper,
  Settings,
  ShoppingBag,
  Tags,
} from "lucide-react";

import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSession } from "@/lib/admin-auth";

const modules = [
  { title: "商品管理", icon: ShoppingBag, href: "/admin/products" },
  { title: "商品分类管理", icon: Tags, href: "/admin/categories" },
  { title: "库存管理", icon: Boxes, href: "/admin/inventory" },
  { title: "订单管理", icon: FileText, href: "/admin/orders" },
  { title: "支付设置", icon: CreditCard, href: "/admin/payment-settings" },
  { title: "SEO文章管理", icon: Newspaper, href: "/admin/articles" },
  { title: "SEO文章生成器", icon: FileText, href: "/admin/seo-generator" },
  { title: "文章分类管理", icon: FolderTree, href: "/admin/article-categories" },
  { title: "站点设置", icon: Settings, href: "/admin/settings" },
];

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accentblue">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-primary">后台管理</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            当前登录账号：{session.username}。后台仅用于运营商品、订单、
            发货和 SEO 内容，不影响前台免注册下单流程。
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-deal">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-primary">{module.title}</h2>
                  {module.href ? (
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href={module.href}>进入</Link>
                    </Button>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      功能待后续阶段实现
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
