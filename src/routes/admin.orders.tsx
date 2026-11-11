import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders | Jersey Fit Admin" }, { name: "description", content: "Review Jersey Fit customer orders and fulfilment." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Orders | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit order management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OrdersPage,
});