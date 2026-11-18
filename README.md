# Jersey Fit Admin Studio

# TASK: Build a PREMIUM, FRONTEND-ONLY ADMIN PANEL for the existing "Jersey Fit" e-commerce website

Build everything below in ONE go, in the order given in section 14. Do not stop halfway and do not simplify any section. There is NO backend and NO database: all data is stored in localStorage through the existing helper in src/lib/storage.ts (add new keys to its KEYS object and add "SWAP POINT: replace with API call" comments). The goal is a realistic demo where the admin manages everything and the changes show on the storefront.

## 0. EXISTING PROJECT CONTEXT (read the code, do not break it)
Jersey Fit sells custom-printed sports jerseys and ready-made tops in India. Stack: TanStack Start + React 19 + TypeScript (strict, exactOptionalPropertyTypes, noUncheckedIndexedAccess) + Tailwind v4 + shadcn/ui (src/components/ui) + framer-motion + recharts + jsPDF + sonner + react-hook-form + zod. Routing is file-based in src/routes (bare `$param` for dynamic routes; NEVER edit src/routeTree.gen.ts). Prettier style: double quotes, trailing commas. Fonts: Anton (headings), Manrope (body). The storefront is dark-only with oklch tokens in src/styles.css. Follow AGENTS.md.
Key files: src/data/products.ts (CATEGORIES, TOP_WEAR_CATEGORY, WINTER_TOP_WEAR_CATEGORY, CUSTOM_PREMIUM_CATEGORY, TOP_WEAR_SUBCATEGORIES, WINTER_SUBCATEGORIES, PRODUCTS p1-p34, PRINT_CHARGES, QTY_DISCOUNT_TIERS, CUSTOM_TSHIRT_OPTIONS / PRODUCT / MOQ), src/types.ts, src/store/app.tsx (auth, cart, orders, addresses, reviews, COUPONS, GST_RATE = 5%), src/lib/invoice.ts (downloadInvoice, jsPDF), src/routes/* (shop, premium-collection, winter-top-wear, product.$productId, custom-tshirt-design, cart, checkout, profile.orders, profile.address, customers, about, contact, index), components (Navbar, Footer, ProductCard, QtyDiscountList, MobileFilterSheet, CategoryFilterList, AnnouncementBar, AuthModal, RequireAuth).

Domain facts:
- Product fields: id, code, name, category, subCategory?, price, mrp, material, description, images[4], rating, tag?, isExclusiveTopWear?.
- Print types: Sublimation Print, DTF Print, No Print. Add-ons per piece: Logo +40, Name +30, Number +30. Sizes: XS, S, M, L, XL, 2XL, 3XL. Roster upload (Excel/CSV/PDF) is offered above 15 pieces.
- Bulk discount (product price only, never print charges): 10-22 pcs 10%, 23-40 pcs 20%, 41-70 pcs 30%, 71+ pcs 40%.
- Coupons: JERSEY100 (flat 100), FIT200 (flat 200 above 2000), SQUAD500 (flat 500 above 6000). GST 5%.
- Order statuses: Placed, Packed, Shipped, Out for Delivery, Delivered. Order = items (CartItem: logo data URL, rosterName, name/number rows, sizes, note, discount fields), address (optional company + GSTIN), payment, payMode full|advance, amountPaid, balancePaid, subtotal, discount, coupon, gst, total, statusIndex, reviewedProducts.

### 0.5 TWO PRODUCT FAMILIES (core rule for the whole admin panel)
The store has exactly 5 sections in 2 families. Every admin screen, form, report and setting must respect this.
A) CUSTOMISABLE family (3 sections):
   1. Custom Team Jersey: the 11 categories all-over-print, front-print, back-print, cricket, football, volleyball, basketball, kabaddi, ganesh-puja, morning-walk, marathon (page /shop). They have no subcategories by default, but the admin can add some.
   2. Custom Premium Collection: category custom-premium (page /premium-collection).
   3. Custom Your Design: standalone page /custom-tshirt-design where the customer uploads their own design; its 3 print options act as subcategories: Front Printed Jersey (599), Front & Back Printed Jersey (749), All Over Print Jersey (899).
   Rules: print type, add-ons (Logo, Name, Number), sizes, per-unit name/number rows, roster upload above the threshold, logo/design upload, note, MOQ 5 (default), bulk discount on product price only, 50% advance payment allowed.
B) READYMADE family (2 sections):
   4. Sports Top Wear: category top-wear, subcategories round-neck and polo-neck (sold through /shop?category=top-wear).
   5. Winter Sports Wear: category winter-top-wear, subcategories hoodie, sweatshirt, oversized-tshirt (page /winter-top-wear only, never inside /shop).
   Rules: NO print type, NO add-ons, NO logo/name/number, NO roster, NO bulk discount, MOQ 1 and MAX 3 pieces per order, sizes still apply, full payment only (a readymade-only cart cannot use 50% advance), isExclusiveTopWear = true.
Add `family: "customisable" | "readymade"` to the category registry (set from the section; the admin can see it but cannot break the rule). Show a family badge (Customisable / Readymade) wherever categories, products and orders are listed.

### Known gaps you MUST fix as part of this task
1. Products, discounts, print charges, MOQ, coupons and GST are hardcoded, so admin changes would not reach the storefront.
2. Orders have no customer identity (no userId/email), and cart/orders/addresses are not scoped per user.
3. The roster Excel/CSV/PDF upload stores only a file name, not the file.
4. src/routes/customers.tsx ("Our Customers") is a hardcoded array.
5. profile.orders.tsx auto-advances status every 25 seconds and has a demo "Advance status" button, which would override admin updates.
6. MOQ is only displayed on the product page, not enforced.

## 1. ADMIN ARCHITECTURE
- Routes: /admin/login, /admin (dashboard), /admin/analytics, /admin/products, /admin/products/new, /admin/products/$productId, /admin/categories, /admin/orders, /admin/orders/$orderId, /admin/order-status, /admin/customers, /admin/customers/$customerId, /admin/payments, /admin/discounts, /admin/moq, /admin/print-settings, /admin/coupons, /admin/our-customers, /admin/settings.
- In src/routes/__root.tsx render AnnouncementBar, Navbar, Footer, AuthModal and the dark Toaster ONLY when the pathname does not start with /admin.
- Admin layout: shadcn Sidebar (collapsible to icons, mobile Sheet, grouped menu: Overview, Catalog, Sales, Customers, Settings), sticky top bar with global search, notifications bell, theme switch and avatar menu (profile, logout), breadcrumbs, animated page transitions.
- Demo admin auth, separate from customer login: admin@jerseyfit.in / admin123, session in `jf_admin_session`, a RequireAdmin guard, and a premium login page showing the demo credentials. All /admin pages get noindex meta.
- One admin context store (src/store/admin.tsx) plus a shared data layer src/lib/catalog.ts used by BOTH admin and storefront (section 11). Organise code in src/components/admin/* and src/lib/admin/*.
- Reusable components: DataTable (sort, filter, search, pagination, column toggle, CSV export), StatCard, StatusBadge, FamilyBadge, ImageUploader (drag and drop, compression), ConfirmDialog, EmptyState, PageHeader, ThemeSwitch, CategoryTree.

## 2. THEME: DARK / LIGHT SWITCH (admin only)
- Animated sun/moon switch in the top bar, persisted in `jf_admin_theme`, defaulting to the system preference.
- Scope it with an `.admin-theme` wrapper (and `.dark` inside it only). Define full oklch token sets for admin light and admin dark (background, surface, card, border, muted, primary electric blue, accent orange, lime success, destructive). The storefront must stay exactly as it is.
- Look: premium, modern, glassmorphism cards, brand gradient (blue to orange to neon-lime) used sparingly on KPI icons, active menu item, primary buttons and chart accents; rounded-2xl; soft shadows; hover lift; skeleton loaders; framer-motion transitions; sonner toasts; beautiful empty states; responsive at 360, 768 and 1280 px. Never hardcode colours; use tokens.

## 3. DEMO DATA
- On first admin load seed localStorage: all current products (`jf_admin_products`), the category registry, about 15 demo customers, about 45 demo orders over the last 6 months (mixed sections, families, print types, sizes, statuses, payment methods, 50% advance orders on customisable carts only, coupons, bulk discounts, placeholder logo images, some with roster files), and matching payments. Flag seeded records `demo: true`.
- Settings: "Reset demo data", "Export JSON backup", "Import JSON backup", and a localStorage usage meter.
- localStorage is about 5 MB: compress every uploaded image on the client (canvas, max 900 px, JPEG 0.8) and reject files over 2 MB.

## 4. DATA MODEL CHANGES (src/types.ts and store/app.tsx)
- Order: add userId, customerName, customerEmail, customerPhone, statusHistory [{status, date, note?}], updatedAt. Update placeOrder to fill them from the logged-in user. Group customers by customerEmail. Filter "My Orders" and addresses by the logged-in user.
- CartItem: add rosterFile?: { name, mime, dataUrl } (max 2 MB) next to rosterName, and update onRoster in product.$productId.tsx to keep the file. The custom-tshirt-design upload is already stored in `logo`; treat it as the customer's design file.
- Category registry (editable): { slug, label, image, description, family, type: "custom" | "premium" | "readymade" | "custom-tshirt", subcategories: [{ slug, label }] }. Seed from the existing constants.

## 5. DASHBOARD AND ANALYTICS
Dashboard: animated KPI cards (Total revenue, Orders, Customers, Average order value, Pending orders, Advance balance pending) with trend % vs previous period; revenue area chart (7d / 30d / 6m toggle); orders-by-status donut; revenue split Customisable vs Readymade and by each of the 5 sections; top 5 products; top categories bar; recent 8 orders table with status badges; recent payments feed; quick actions (Add product, Update order status, Add coupon).
Analytics: date-range picker (shadcn Calendar); revenue vs orders line chart; sales by section, category and subcategory; print type split (Sublimation / DTF / No Print, customisable only); payment method split (UPI / Card / Net Banking / COD); full vs 50% advance; coupon usage; bulk-discount tier usage; new vs repeat customers; size distribution XS to 3XL; top customers by spend; CSV export on every table; a Family filter on all charts. Use recharts through the existing shadcn chart component.

## 6. PRODUCT MANAGEMENT (all 5 sections)
- Product list: filters by family, section, category and subcategory, search, price range, sort, grid/table toggle, bulk delete, pagination; show tag, rating, price/mrp and the MOQ source.
- Add/Edit form (sectioned or stepper) containing EVERY field the storefront uses: name, code (auto-suggest JF-xxx, unique), CATEGORY (required), SUBCATEGORY (REQUIRED whenever the selected category has subcategories; hidden when it has none), price, mrp (mrp >= price, live % OFF), material, description, up to 4 images (drag and drop, reorder, first = main, compressed), rating, tag/badge, isExclusiveTopWear (auto-true for readymade). The form adapts to the family:
  • Customisable: show an "Effective rules" panel (resolved MOQ, discount tiers, print types, add-on charges) and a live ProductCard preview.
  • Readymade: HIDE print type, add-ons, discount tiers and roster settings; show a fixed info box "Readymade: MOQ 1, max 3 pieces, no customisation, full payment only". Subcategory is REQUIRED (round-neck or polo-neck for Sports Top Wear; hoodie, sweatshirt or oversized-tshirt for Winter Sports Wear).
  • Custom Your Design: managed as its 3 print options (subcategories) with editable price, mrp and MOQ, in a dedicated "Custom Your Design options" tab.
- Validate with zod + react-hook-form with inline errors. Delete with a confirm dialog, plus a duplicate action. All changes appear instantly on the storefront.
- /admin/categories: add, edit and delete categories and subcategories (image, description). Block deleting anything that still has products and offer to reassign them.

## 7. ORDERS, ORDER STATUS, CUSTOMERS, PAYMENTS
- Orders list: filters (status, family, section, payment method, full/advance, date range), search by order id or customer, sortable columns, status badges, CSV export.
- Order detail: customer details and shipping address (plus company and GSTIN if present); every item with print type, add-ons, size x qty, per-unit Name/Number rows, note, bulk discount, coupon, GST breakdown, payment mode, amount paid and balance; a status timeline with history. Downloads: (1) the customer's uploaded logo/design image (data URL to file, with thumbnail), (2) the customer's uploaded roster Excel/CSV/PDF (disabled with a tooltip if none), (3) Order PDF (jsPDF production sheet: items, sizes, names and numbers, notes, logo thumbnail), (4) Invoice (reuse downloadInvoice). For readymade items hide logo, roster, name/number rows and print type and show "Readymade, no customisation"; the Invoice works for every order. Add a "Mark balance paid" action for advance orders.
- /admin/order-status: a Kanban board (Placed, Packed, Shipped, Out for Delivery, Delivered) with drag and drop or a "Move to" menu, plus a table view with bulk status update, optional note and a history log. Persist through the orders storage key so customers see it in My Orders. Remove the 25-second auto-advance and the demo "Advance status" button from profile.orders.tsx so the admin controls status.
- Customers: table with name, email, phone, city, joined date, ORDER COUNT, TOTAL MONEY SPENT, average order value, last order date, customisable vs readymade order counts, and a repeat-customer badge; search and sort. Customer detail: profile, addresses, lifetime-value cards, spend-over-time chart, full order history.
- Payments: revenue cards (today, 7 days, 30 days, lifetime; collected vs pending balance), recent payments table (order id, customer, method, mode, amount, date, status), revenue chart and method split.

## 8. DISCOUNTS, MOQ, PRINT SETTINGS, COUPONS
Resolution order for Discounts, MOQ and Print settings: SUBCATEGORY override first; if none, CATEGORY override (used directly for categories without subcategories, like the 11 Custom Team Jersey categories); otherwise the FAMILY/GLOBAL default. Each page shows a category tree on the left and an editor on the right, with an "Inherited from category/global" badge and a "Reset to inherited" button.
- Discounts (customisable sections ONLY; disabled for readymade with the note "Readymade products have no discounts"): editable tiers {min, max|null, pct} (defaults 10-22: 10%, 23-40: 20%, 41-70: 30%, 71+: 40%), validation for overlaps and gaps, enable/disable, applies to product price only, live example calculator.
- MOQ: customisable sections use a minimum quantity (default 5); readymade sections allow editing minimum (default 1) and MAXIMUM (default 3) per subcategory/category. Enforce on the product page add-to-cart.
- Print settings (customisable sections ONLY): enabled print types (Sublimation, DTF, No Print), add-on charges Logo / Name / Number (defaults 40 / 30 / 30), which add-ons are allowed, roster upload threshold (default above 15 pcs).
- Coupons: full CRUD with code (unique, uppercase), label, flat amount, minimum subtotal, active toggle, start and expiry date, usage limit and usage count. Seed JERSEY100, FIT200, SQUAD500.
- /admin/settings also holds the GST rate (5%), store details and the demo-data tools.

## 9. OUR CUSTOMERS MANAGER (/admin/our-customers)
- Grid/list of showcase entries with edit and delete. Add form: image upload (required, compressed), client name (required), location (required), description (required), then dependent dropdowns Category, Subcategory and Product. Category, Subcategory and Product are OPTIONAL: the form must submit successfully without them. Store in `jf_customer_showcase`.
- Refactor src/routes/customers.tsx to render the 8 existing customers plus admin-created entries from storage. Show the "View Jersey Details" button/link only when a product is selected; otherwise show the category label (or nothing).

## 10. UX AND QUALITY
Accessible (labels, focus states, aria), a toast for every action, confirm dialogs for destructive actions, loading skeletons, empty states, inline validation errors, SEO titles, clean typed code with no `any`, working on mobile, tablet and desktop.

## 11. STOREFRONT INTEGRATION (critical)
Create src/lib/catalog.ts exposing getProducts(), getProduct(id), getCategories(), resolvePricingConfig(product) returning { family, moq, maxQty, discountTiers, printCharges, printTypes, addOnsAllowed }, getCoupons(), getGstRate(), getShowcaseCustomers(), all reading admin localStorage data with the static seed as fallback. Replace hardcoded usage in: shop.tsx, premium-collection.tsx, winter-top-wear.tsx, index.tsx, MobileFilterSheet.tsx, CategoryFilterList.tsx, product.$productId.tsx (PRINT_CHARGES, MOQ text and validation, getQtyDiscountPct), custom-tshirt-design.tsx (options, prices, MOQ), QtyDiscountList.tsx, ProductCard.tsx (MOQ badge), store/app.tsx (COUPONS, GST_RATE), Navbar and Footer category lists, and customers.tsx. Be SSR-safe: render the seed on the server, then hydrate from localStorage after mount, so there are no hydration mismatches.

## 12. WORKFLOW CHECKS (verify before finishing)
- Admin login works; the theme switch works only inside the admin and the storefront is unchanged.
- Adding a product requires category and, when available, subcategory; it appears on the storefront immediately; edit and delete work. Readymade products never show print options, discounts or roster.
- A customer order placed on the storefront appears in admin Orders with customer details; the logo, roster file, order PDF and invoice downloads work.
- Updating status in the admin is reflected in the customer's My Orders and auto-advance is gone.
- Customers page shows order count and total spent; Payments shows recent payments and revenue.
- Changing a discount tier, MOQ, print charge or coupon in the admin changes storefront behaviour (subcategory override, then category override, then family/global).
- Our Customers entries can be added with or without category/subcategory/product.
- No existing storefront feature (cart, checkout, 50% advance, reviews, invoices) is broken.

## 13. DO NOT
Do not add a backend, database or real auth. Do not change the storefront look. Do not hardcode colours. Do not edit routeTree.gen.ts. Do not mix readymade rules into customisable products or the reverse.

## 14. BUILD ORDER
1) Types, catalog data layer, storefront integration and the order/customer data fixes. 2) Admin shell, theme, auth, reusable components, demo seed. 3) Products and categories. 4) Orders, order status, customers, payments. 5) Dashboard and analytics. 6) Discounts, MOQ, print settings, coupons, settings. 7) Our Customers manager. 8) Final pass against section 12, then summarise the changed files and the demo login.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84044d31-4ff7-4b22-b6aa-595b3542a0c5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
