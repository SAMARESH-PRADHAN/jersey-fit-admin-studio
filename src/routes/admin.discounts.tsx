import { createFileRoute } from "@tanstack/react-router";
import { RuleEditorPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/discounts")({
  head: () => ({ meta: [{ title: "Discounts | Jersey Fit Admin" }, { name: "description", content: "Manage Jersey Fit bulk discounts for customisable products." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Discounts | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit volume pricing rules." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <RuleEditorPage kind="discounts" />,
});