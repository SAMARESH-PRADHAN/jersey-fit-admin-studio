import { createFileRoute } from "@tanstack/react-router";
import { RuleEditorPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/moq")({
  head: () => ({ meta: [{ title: "MOQ Settings | Jersey Fit Admin" }, { name: "description", content: "Set minimum and maximum order quantities by family and category." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "MOQ Settings | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit order quantity settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <RuleEditorPage kind="moq" />,
});