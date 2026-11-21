import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers | Jersey Fit Admin" }, { name: "description", content: "Customer order history, spend and account activity." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Customers | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit customer management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CustomersPage,
});