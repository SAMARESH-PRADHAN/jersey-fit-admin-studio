import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products | Jersey Fit Admin" }, { name: "description", content: "Manage customisable jerseys and readymade sportswear." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Products | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit catalog management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProductsPage,
});