import Link from "next/link";
import { Search, ShoppingBag, Headphones } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";

const navItems = [
  { href: "/products", label: "产品中心", icon: ShoppingBag },
  { href: "/order/query", label: "查询订单", icon: Search },
  { href: "/contact", label: "联系客服", icon: Headphones },
  { href: "/blog", label: "SEO文章" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Logo />
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <Link href={item.href}>
                  {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
