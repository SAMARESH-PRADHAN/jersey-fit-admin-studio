import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/products_/$productId")({
  head: () => ({ meta: [{ title: "Product Details | Jersey Fit Admin" }, { name: "description", content: "Review and edit a Jersey Fit catalog product." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Product Details | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit product details." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProductDetailPage,
});