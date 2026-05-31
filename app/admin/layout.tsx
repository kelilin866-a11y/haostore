import { AdminNavigation } from "@/components/site/AdminNavigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminNavigation>{children}</AdminNavigation>;
}
