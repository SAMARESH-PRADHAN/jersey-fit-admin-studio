import { useEffect, useState } from "react";
import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shared";
import { AdminProvider } from "@/store/admin";
import { KEYS } from "@/lib/storage";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Jersey Fit Admin" }, { name: "description", content: "Manage Jersey Fit products, orders, customers and store settings." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit store operations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  const [session, setSession] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      return Boolean(window.localStorage.getItem(KEYS.session));
    }
    return null;
  });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    setSession(Boolean(window.localStorage.getItem(KEYS.session)));
  }, [pathname]);
  const isLogin = pathname === "/admin/login";
  if (isLogin) return <AdminProvider><Toaster theme="dark" position="top-right" /><Outlet /></AdminProvider>;
  if (session === false) return <Navigate to="/admin/login" />;
  if (session === null) return <div className="admin-theme admin-dark min-h-screen" aria-label="Loading admin" />;
  return <AdminProvider><Toaster theme="dark" position="top-right" /><AdminShell><Outlet /></AdminShell></AdminProvider>;
}