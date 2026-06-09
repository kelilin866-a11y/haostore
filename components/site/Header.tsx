import Link from "next/link";
import {
  BookOpenText,
  Headphones,
  Home,
  Search,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/products", label: "全部商品", icon: ShoppingBag },
  { href: "/order/query", label: "订单查询", icon: Search },
  { href: "/blog", label: "账号教程", icon: BookOpenText },
  { href: "/contact", label: "售后客服", icon: Headphones },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Logo />
          <form
            action="/products"
            className="relative hidden xl:block xl:w-56"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              name="q"
              placeholder="搜索商品..."
              className="h-10 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 text-sm text-[#0F172A] outline-none transition focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </form>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <Link
                  href={item.href}
                  className="text-[#334155] hover:text-[#1E3A8A]"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
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
