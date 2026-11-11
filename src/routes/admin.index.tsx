import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview | Jersey Fit" }, { name: "description", content: "Jersey Fit revenue, fulfilment, catalog and customer overview." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Admin Overview | Jersey Fit" }, { property: "og:description", content: "Jersey Fit operations overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: DashboardPage,
});