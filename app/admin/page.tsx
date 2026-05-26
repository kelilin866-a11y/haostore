import { Boxes, FileText, Newspaper, Settings, ShoppingBag, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const modules = [
  { title: "商品管理", icon: ShoppingBag },
  { title: "库存管理", icon: Boxes },
  { title: "订单管理", icon: FileText },
  { title: "文章管理", icon: Newspaper },
  { title: "AI 文章生成", icon: Sparkles },
  { title: "站点设置", icon: Settings },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">静态占位</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">后台管理</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          第一阶段不实现登录、权限、真实商品管理、库存管理或订单业务，仅展示后台模块入口。
        </p>
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
                <div>
                  <h2 className="font-semibold text-primary">{module.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">功能待后续阶段实现</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
