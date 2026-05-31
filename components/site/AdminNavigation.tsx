"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminLogoutButton } from "@/components/site/AdminLogoutButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "后台首页" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/categories", label: "商品分类" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/articles", label: "SEO文章管理" },
  { href: "/admin/article-categories", label: "文章分类" },
  { href: "/", label: "前台首页" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/") {
    return false;
  }

  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-2">
            {adminLinks.map((link) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <Button
                  key={link.href}
                  variant={isActive ? "deal" : "outline"}
                  size="sm"
                  asChild
                  className={cn(link.href === "/" && "border-slate-300")}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              );
            })}
          </nav>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </>
  );
}
