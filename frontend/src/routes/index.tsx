import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jersey Fit Admin | Store Management" },
      { name: "description", content: "Manage Jersey Fit products, orders, customers, payments and store settings." },
      { property: "og:title", content: "Jersey Fit Admin | Store Management" },
      { property: "og:description", content: "Admin control room for the Jersey Fit store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Navigate to="/admin" />,
});
