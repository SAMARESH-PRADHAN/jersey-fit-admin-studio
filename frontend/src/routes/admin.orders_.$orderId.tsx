import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/orders_/$orderId")({
  head: () => ({ meta: [{ title: "Order Details | Jersey Fit Admin" }, { name: "description", content: "Jersey Fit order details and production information." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Order Details | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit order information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OrderDetailPage,
});