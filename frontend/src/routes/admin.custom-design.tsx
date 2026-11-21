import { createFileRoute } from "@tanstack/react-router";
import { CustomDesignPage } from "@/components/admin/extra-pages";

export const Route = createFileRoute("/admin/custom-design")({
  head: () => ({ meta: [{ title: "Custom Your Design | Jersey Fit Admin" }, { name: "description", content: "Manage standalone custom design print options and pricing." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Custom Your Design | Jersey Fit Admin" }, { property: "og:description", content: "Manage the three custom Jersey Fit design choices." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CustomDesignPage,
});