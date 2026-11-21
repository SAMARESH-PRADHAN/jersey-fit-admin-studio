import { createFileRoute } from "@tanstack/react-router";
import { OrderStatusPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/order-status")({
  head: () => ({ meta: [{ title: "Order Status | Jersey Fit Admin" }, { name: "description", content: "Update order fulfilment status for Jersey Fit customers." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Order Status | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit order fulfilment updates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OrderStatusPage,
});