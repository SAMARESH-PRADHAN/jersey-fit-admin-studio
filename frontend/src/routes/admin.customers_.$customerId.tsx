import { createFileRoute } from "@tanstack/react-router";
import { CustomerDetailPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/customers_/$customerId")({
  head: () => ({ meta: [{ title: "Customer Details | Jersey Fit Admin" }, { name: "description", content: "Customer profile and Jersey Fit order history." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Customer Details | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit customer profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CustomerDetailPage,
});