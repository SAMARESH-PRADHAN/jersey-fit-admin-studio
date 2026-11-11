import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments | Jersey Fit Admin" }, { name: "description", content: "Jersey Fit payment collection and balances." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Payments | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit payment records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PaymentsPage,
});