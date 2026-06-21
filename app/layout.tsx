import type { Metadata } from "next";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://haomaogo.com").replace(
    /\/$/,
    "",
  );

  return {
    metadataBase: new URL(siteUrl),
    title: settings.default_seo_title,
    description: settings.default_seo_description,
    other: {
      "baidu-site-verification": "codeva-2VOilutMTo",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
