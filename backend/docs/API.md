# Jersey Fit Backend & Storefront API Reference

Complete typed API documentation for Jersey Fit's PostgreSQL & S3 backend.

All endpoints validate inputs using **Zod** schemas.

---

## 1. Authentication & Security

### `auth.login`
- **Access:** Public (Rate limited: max 5 failed attempts / 15 minutes per email)
- **Input:**
  ```typescript
  {
    email: string; // valid email
    password: string; // min 6 characters
  }
  ```
- **Output:**
  ```typescript
  {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "staff";
    };
    token: string; // Signed JWT token (expires in 7 days)
  }
  ```
- **Errors:**
  - `400`: Invalid email or password
  - `429`: Too many failed login attempts. Please try again after 15 minutes.

### `auth.me`
- **Access:** Admin/Staff Only (`Bearer <token>`)
- **Output:**
  ```typescript
  {
    user: {
      userId: string;
      email: string;
      role: "admin" | "staff";
      name: string;
    }
  }
  ```

---

## 2. Storefront / Public APIs

### `storefront.getPublicSettings`
- **Access:** Public (Read-only, cacheable)
- **Output:**
  ```typescript
  {
    storeName: string; // e.g. "Jersey Fit"
    supportEmail: string; // e.g. "hello@jerseyfit.in"
    supportPhone: string; // e.g. "+91 98765 43210"
    gstRate: number; // e.g. 5.0
  }
  ```

### `storefront.listProducts`
- **Access:** Public
- **Input:**
  ```typescript
  {
    search?: string;
    family?: "customisable" | "readymade" | "all";
    section?: string;
    category?: string;
    subCategory?: string; // or "__none__" for products with no subcategory
    page?: number; // default: 1
    pageSize?: number; // default: 8
  }
  ```
- **Output:**
  ```typescript
  {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  ```

### `storefront.getProduct`
- **Access:** Public
- **Input:** `{ id: string }`
- **Output:** `Product | null`

### `storefront.listCategories`
- **Access:** Public
- **Output:** `CategoryRegistryItem[]` (Exactly 4 store categories with hierarchical subcategories)

### `storefront.resolvePricingConfig`
- **Access:** Public
- **Input:**
  ```typescript
  {
    family: "customisable" | "readymade";
    category: string;
    subCategory?: string | null;
  }
  ```
- **Inheritance Chain:** `Subcategory Override` -> `Category Override` -> `Global Family Rule` -> `Hardcoded Defaults`.
- **Output:** `PricingConfig` (MOQ, maxQty, discountTiers, print charges, print types, addOnsAllowed, rosterThreshold).

### `storefront.validateCoupon`
- **Access:** Public
- **Input:** `{ code: string, subtotal: number }`
- **Output:**
  ```typescript
  {
    valid: boolean;
    discount: number;
    coupon?: Coupon;
    reason?: string;
  }
  ```

### `storefront.priceCart`
- **Access:** Public
- **Description:** Server-authoritative price breakdown. Validates MOQs, calculates volume discount tiers (applied exclusively to product unit prices, never print fees), adds printing/add-ons charges, verifies coupon eligibility, and computes GST.
- **Input:**
  ```typescript
  {
    cart: Array<{
      productId: string;
      quantity: number;
      size: string;
      printType?: string;
      addOns?: string[];
      names?: string[];
      numbers?: string[];
      note?: string;
      logoFileUrl?: string;
      rosterFileUrl?: string;
    }>;
    couponCode?: string;
  }
  ```
- **Output:** `CartPricingBreakdown` (item details, discounts, tax, totals).

### `storefront.createOrder`
- **Access:** Public
- **Description:** Full transactional order creation. Validates prices on server, records customer, creates order and line items, creates initial status history (`Placed`), records payments, and increments coupon usage.
- **Input:**
  ```typescript
  {
    cart: CartItemInput[];
    customer: { name: string; email: string; phone: string; city: string };
    address: { line: string; city: string; state: string; pincode: string; company?: string; gstin?: string };
    paymentMethod: "UPI" | "Card" | "Net Banking" | "COD";
    payMode: "full" | "advance";
    couponCode?: string;
  }
  ```
- **Output:** `Order` record with order id format `"JF-####"`.

---

## 3. Protected Admin APIs (`Bearer <token>`)

### Catalog Management
- **`admin.products.create`**: `{ code, name, family, section, category, subCategory?, price, mrp, ... }` (Enforces `mrp >= price`, max 4 images, unique code).
- **`admin.products.update`**: `{ id, data }`.
- **`admin.products.delete`**: `{ id }`.
- **`admin.products.bulkDelete`**: `{ ids: string[] }`.
- **`admin.categories.create`**: `{ slug, label, family, type, section, subcategories }`.
- **`admin.categories.update`**: `{ slug, data }`.
- **`admin.categories.delete`**: `{ slug }` (Blocked with an error if category still has products).

### Rules & Discounts
- **`admin.rules.save`**:
  - `params`: `{ scope: "global" | "category" | "subcategory", family, categorySlug?, subcategorySlug?, kind: "discounts" | "moq" | "print-settings", values }`
- **`admin.rules.reset`**:
  - `params`: `{ scope: "category" | "subcategory", family, categorySlug, subcategorySlug?, kind }` (Removes overrides so values inherit from higher levels).

### Coupons Management
- **`admin.coupons.list`** $\to$ `Coupon[]`
- **`admin.coupons.create`** $\to$ Validates unique code, date range.
- **`admin.coupons.update`** $\to$ Updates details.
- **`admin.coupons.toggleActive`** $\to$ `{ code, active: boolean }`
- **`admin.coupons.delete`** $\to$ `{ code }`

### Orders & Fulfillment
- **`admin.orders.list`**: `{ search?, status?, family?, mode?, page?, pageSize? }`.
- **`admin.orders.get`**: `{ id }` (Returns order, items, status history).
- **`admin.orders.updateStatus`**: `{ id, status: OrderStatus, note? }` (Updates status, appends to `order_status_history`).
- **`admin.orders.markBalancePaid`**: `{ orderId }` (Zeroes `balancePaid`, updates `amountPaid`, creates a `Collected` payment record).

### Customers & Payments
- **`admin.customers.list`**: Returns customers with computed metrics (`orderCount`, `spend`, `avg`, `last`, `custom`, `ready`).
- **`admin.customers.get`**: `{ id }` (Detailed customer record, lifetime spend, order history).
- **`admin.payments.list`**: All payment transactions.
- **`admin.payments.summary`**: Revenue aggregated by period (`today`, `last7Days`, `last30Days`, `lifetime`, `pending`, and by payment method).

### Storage & Uploads
- **`storage.getPresignedUploadUrl`**:
  - `params`: `{ type: "product_image" | "logo" | "roster", fileName, mimeType, sizeBytes }`
  - Validates image $\le$ 2MB, CSV $\le$ 5MB. Returns `{ uploadUrl, key, fileUrl }`.
- **`storage.getPresignedDownloadUrl`**:
  - `params`: `{ key: string }`
  - Generates time-limited signed URL for private logos and rosters.

### Reporting, Analytics & Backup
- **`admin.reports.getDashboardStats`**: `{ period: "Daily" | "Weekly" | "Monthly" }` (Aggregated total revenue, AOV, pending orders, status pie distribution, revenue by section, time trend buckets, top 5 products).
- **`admin.reports.getAnalytics`**: `{ range?: { start, end }, family? }` (Revenue vs orders by section, size distribution, top 8 customers by spend).
- **`admin.reports.exportCsv`**: `{ entity, records }`.
- **`admin.backup.export`**: Full JSON backup including **all** entities: products, categories, customers, orders, payments, coupons, rules, settings, custom design options, and product reviews.
- **`admin.backup.restore`**: `{ backup }` (Transactional restore with conflict resolution).
