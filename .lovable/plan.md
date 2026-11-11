# Jersey Fit Admin Demo

## What will be built
- A standalone, responsive admin experience at `/admin/*` with demo login, separate admin theme, grouped navigation, reusable catalog/table/form patterns, seeded local demo records, and reset/import/export tools.
- Product/category management, orders and status updates, customer and payment views, dashboard/analytics, rule and coupon editors, and the Our Customers showcase manager, all persisted in localStorage.
- A shared catalog/rules layer that uses static sample data during server rendering and localStorage after hydration, plus order/cart-compatible types and customer-scoped demo order behavior where the storefront exists.
- The root route remains a useful Jersey Fit storefront entry point; admin pages stay isolated from customer-facing shell and styling.

## Implementation approach
1. Establish typed data models, localStorage helpers, seed/demo fixtures, catalog configuration resolution, and storefront compatibility.
2. Add the admin-only shell, login/session guard, theme tokens, shared controls, and responsive navigation.
3. Build catalog, order, customer, payment, dashboard/analytics, settings, and showcase views on shared local data.
4. Verify representative admin flows, responsive behavior, and the latest build/runtime diagnostics.

## Technical details
- The repository currently contains only the TanStack template: referenced Jersey Fit files such as `src/lib/storage.ts`, `src/data/products.ts`, `src/store/app.tsx`, storefront routes, and storefront components are absent. Implement the admin as a self-contained localStorage demo and avoid claiming integration into unavailable storefront screens; provide the shared catalog API for future storefront wiring.
- Use file-based TanStack routes and never edit generated route files. Keep all demo data in browser storage with server-safe seed fallbacks; do not add backend, database, or real authentication.
- Record any new structural convention in the root `AGENTS.md` before completion.
