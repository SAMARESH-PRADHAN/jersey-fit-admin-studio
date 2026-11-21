import { createFileRoute } from "@tanstack/react-router";
import { CouponsPage } from "@/components/admin/pages";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons | Jersey Fit Admin" }, { name: "description", content: "Manage Jersey Fit coupon offers and usage limits." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Coupons | Jersey Fit Admin" }, { property: "og:description", content: "Jersey Fit coupon management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CouponsPage,
});