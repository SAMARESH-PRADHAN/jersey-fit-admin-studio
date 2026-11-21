import { createFileRoute } from "@tanstack/react-router";
import { RuleEditor } from "@/components/admin/rule-editor";

export const Route = createFileRoute("/admin/print-settings")({
  head: () => ({ meta: [{ title: "Print Settings | Jersey Fit Admin" }, { name: "description", content: "Set custom print types, add-on prices and roster upload rules." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Print Settings | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit custom print settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <RuleEditor kind="print-settings" />,
});