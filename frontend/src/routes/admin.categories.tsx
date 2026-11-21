import { createFileRoute } from "@tanstack/react-router";
import { CategoriesPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories | Jersey Fit Admin" }, { name: "description", content: "Manage Jersey Fit product categories and subcategories." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Categories | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit category management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CategoriesPage,
});