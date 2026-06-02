import Link from "next/link";

import { siteConfig } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-500 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold text-primary">{siteConfig.name}</p>
          <p className="mt-2 leading-6">{siteConfig.description}</p>
        </div>
        <div>
          <p className="font-semibold text-primary">快速入口</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/products" className="hover:text-primary">
              产品中心
            </Link>
            <Link href="/order/query" className="hover:text-primary">
              订单查询
            </Link>
            <Link href="/contact" className="hover:text-primary">
              联系客服
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-primary">政策说明</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/policy/terms" className="hover:text-primary">
              服务条款
            </Link>
            <Link href="/policy/after-sales" className="hover:text-primary">
              售后政策
            </Link>
            <span>Telegram: {siteConfig.customerTelegram}</span>
            <span>Email: {siteConfig.customerEmail}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
