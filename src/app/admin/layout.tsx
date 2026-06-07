"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/AppContext";
import AdminSidebar from "@/components/admin/AdminSidebar";

const PAGE_MAP: Record<string, string> = {
  dashboard: "/admin/dashboard",
  agencies: "/admin/agencies",
  schedules: "/admin/schedules",
  keuangan: "/admin/keuangan",
};

const PATH_TO_PAGE: Record<string, string> = {
  "/admin/dashboard": "dashboard",
  "/admin/agencies": "agencies",
  "/admin/schedules": "schedules",
  "/admin/keuangan": "keuangan",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppStore();

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "provider")) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user || (user.role !== "admin" && user.role !== "provider")) return null;

  const activePage = PATH_TO_PAGE[pathname] || "dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar activePage={activePage} onNavigate={(page) => router.push(PAGE_MAP[page] || "/admin/dashboard")} />
      <main style={{ marginLeft: "var(--sidebar-w, 280px)", flex: 1, padding: "40px 48px", overflowX: "hidden" }}>{children}</main>
    </div>
  );
}
