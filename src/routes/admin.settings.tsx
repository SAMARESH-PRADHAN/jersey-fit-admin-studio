import { createFileRoute } from "@tanstack/react-router";
import { StoreSettingsPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings | Jersey Fit Admin" }, { name: "description", content: "Update Jersey Fit store details, tax rate and demo backups." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Settings | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit store settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StoreSettingsPage,
});