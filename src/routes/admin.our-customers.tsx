import { createFileRoute } from "@tanstack/react-router";
import { ShowcasePage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/our-customers")({
  head: () => ({ meta: [{ title: "Our Customers | Jersey Fit Admin" }, { name: "description", content: "Manage customer stories shown on Jersey Fit." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Our Customers | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit customer showcase manager." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ShowcasePage,
});