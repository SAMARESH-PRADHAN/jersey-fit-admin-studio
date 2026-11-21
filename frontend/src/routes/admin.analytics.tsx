import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Jersey Fit Admin" }, { name: "description", content: "Jersey Fit sales, product and customer analytics." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Analytics | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit business analytics." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AnalyticsPage,
});