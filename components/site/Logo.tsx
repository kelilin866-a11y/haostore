import Link from "next/link";

import { siteConfig } from "@/lib/constants";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
        VG
      </span>
      <span className="min-w-0 text-base font-semibold">{siteConfig.name}</span>
    </Link>
  );
}
