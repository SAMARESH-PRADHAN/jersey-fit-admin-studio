import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Sign In | Jersey Fit" }, { name: "description", content: "Sign in to the Jersey Fit demo admin workspace." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Admin Sign In | Jersey Fit" }, { property: "og:description", content: "Jersey Fit admin demo access." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: LoginPage,
});