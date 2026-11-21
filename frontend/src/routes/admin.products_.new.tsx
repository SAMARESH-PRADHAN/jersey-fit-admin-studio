import { createFileRoute } from "@tanstack/react-router";
import { ProductNewPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/products_/new")({
  head: () => ({ meta: [{ title: "Add Product | Jersey Fit Admin" }, { name: "description", content: "Create a Jersey Fit catalog product." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Add Product | Jersey Fit Admin" }, { property: "og:description", content: "Create a Jersey Fit catalog product." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProductNewPage,
});