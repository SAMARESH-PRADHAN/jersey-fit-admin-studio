import { createFileRoute } from "@tanstack/react-router";
import { ReviewAnalysisPage } from "@/components/admin/extra-pages";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Review Analysis | Jersey Fit Admin" }, { name: "description", content: "Analyze product ratings, customer feedback, and review sentiment." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Review Analysis | Jersey Fit Admin" }, { property: "og:description", content: "Review Jersey Fit product feedback and sentiment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ReviewAnalysisPage,
});