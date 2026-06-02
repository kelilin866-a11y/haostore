import Link from "next/link";

import { getSiteSettings } from "@/lib/site-settings";

export async function Logo() {
  const settings = await getSiteSettings();

  return (
    <Link href="/" className="flex items-center gap-2 text-primary">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
        VG
      </span>
      <span className="min-w-0 text-base font-semibold">
        {settings.site_name}
      </span>
    </Link>
  );
}
