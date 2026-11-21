import { describe, it, expect, beforeAll } from "vitest";
import { CatalogService } from "../services/catalog.js";
import { CouponService } from "../services/coupons.js";
import { SettingsService } from "../services/settings.js";
import { OrderService } from "../services/orders.js";
import { db } from "../db/index.js";
import { products } from "../db/schema/catalog.js";
import { coupons } from "../db/schema/rules.js";
import { showcaseCustomers } from "../db/schema/settings.js";
import { eq } from "drizzle-orm";

describe("Live Database CRUD Verification Across All Modules", () => {
  const timestamp = Date.now();

  // --- 1. Products CRUD ---
  it("performs full CREATE, READ, UPDATE, and DELETE for Products in database", async () => {
    const testProduct = {
      id: `test-prod-${timestamp}`,
      code: `TEST-${timestamp}`.slice(0, 15),
      name: "Vitest Automated Jersey",
      family: "customisable" as const,
      section: "Custom Team Jersey" as const,
      category: "custom-team-jersey",
      subCategory: "all-over-print",
      price: 899,
      mrp: 1299,
      material: "Test polyester",
      description: "Automated test description",
      overview: "Automated test overview",
      washCare: "Hand wash cold",
      designGuidelines: "SVG vector format",
      images: ["https://example.com/jersey.jpg"],
      rating: 4.8,
      isExclusiveTopWear: false,
      active: true,
      demo: true,
    };

    // CREATE
    const created = await CatalogService.createProduct(testProduct);
    expect(created.id).toBe(testProduct.id);

    // READ
    const fetched = await CatalogService.getProduct(testProduct.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("Vitest Automated Jersey");

    // UPDATE
    const updated = await CatalogService.updateProduct(testProduct.id, {
      name: "Vitest Automated Jersey (Updated)",
      price: 949,
      mrp: 1399,
    });
    expect(updated.name).toBe("Vitest Automated Jersey (Updated)");
    expect(updated.price).toBe(949);

    // DELETE
    const delRes = await CatalogService.deleteProduct(testProduct.id);
    expect(delRes.success).toBe(true);

    const afterDelete = await CatalogService.getProduct(testProduct.id);
    expect(afterDelete).toBeNull();
  });

  // --- 2. Categories CRUD ---
  it("performs full CREATE, READ, UPDATE, and DELETE for Categories in database", async () => {
    const slug = `test-cat-${timestamp}`;
    const categoryData = {
      slug,
      label: "Vitest Test Category",
      family: "customisable" as const,
      type: "custom" as const,
      section: "Custom Team Jersey" as const,
      description: "Test category desc",
      image: "https://example.com/cat.jpg",
      subcategories: [
        { slug: `sub-${timestamp}`, label: "Test Subcat" }
      ],
    };

    // CREATE
    const created = await CatalogService.createCategory(categoryData);
    expect(created.slug).toBe(slug);

    // READ
    const all = await CatalogService.listCategories();
    const found = all.find((c) => c.slug === slug);
    expect(found).toBeDefined();
    expect(found?.label).toBe("Vitest Test Category");

    // UPDATE
    const updated = await CatalogService.updateCategory(slug, {
      ...categoryData,
      label: "Vitest Test Category (Modified)",
    });
    expect(updated.label).toBe("Vitest Test Category (Modified)");

    // DELETE
    const delRes = await CatalogService.deleteCategory(slug);
    expect(delRes.success).toBe(true);

    const allAfter = await CatalogService.listCategories();
    expect(allAfter.find((c) => c.slug === slug)).toBeUndefined();
  });

  // --- 3. Coupons CRUD ---
  it("performs full CREATE, READ, UPDATE, TOGGLE, and DELETE for Coupons in database", async () => {
    const code = `TEST${String(timestamp).slice(-5)}`;
    const couponData = {
      code,
      label: "Vitest Test Promo",
      amount: 150,
      discountType: "flat" as const,
      minimumSubtotal: 1000,
      active: true,
      startsAt: new Date().toISOString(),
      expiresAt: null,
      usageLimit: 50,
    };

    // CREATE
    const created = await CouponService.create(couponData);
    expect(created.code).toBe(code);

    // READ
    const list = await CouponService.list();
    const found = list.find((c) => c.code === code);
    expect(found).toBeDefined();
    expect(found?.amount).toBe(150);

    // UPDATE
    const updated = await CouponService.update(code, { amount: 250, label: "Updated Promo" });
    expect(updated.amount).toBe(250);

    // TOGGLE
    const toggled = await CouponService.toggleActive(code, false);
    expect(toggled.active).toBe(false);

    // DELETE
    const delRes = await CouponService.delete(code);
    expect(delRes.success).toBe(true);

    const listAfter = await CouponService.list();
    expect(listAfter.find((c) => c.code === code)).toBeUndefined();
  });

  // --- 4. Showcase Customers CRUD ---
  it("performs CREATE, READ, and DELETE for Showcase Stories in database", async () => {
    const storyData = {
      name: "Aarav Test",
      location: "Bengaluru, India",
      description: "Amazing automated test team kits!",
      image: "https://example.com/showcase.jpg",
    };

    // CREATE
    const created = await SettingsService.createShowcase(storyData);
    expect(created.id).toBeDefined();

    // READ
    const list = await SettingsService.listShowcase();
    expect(list.some((s) => s.id === created.id)).toBe(true);

    // DELETE
    const delRes = await SettingsService.deleteShowcase(created.id);
    expect(delRes.success).toBe(true);

    const listAfter = await SettingsService.listShowcase();
    expect(listAfter.some((s) => s.id === created.id)).toBe(false);
  });

  // --- 5. Store Settings UPDATE ---
  it("performs READ and UPDATE for Store Settings in database", async () => {
    const original = await SettingsService.getSettings();

    const updated = await SettingsService.updateSettings({
      storeName: "Jersey Fit Studio",
      gstRate: 5.0,
      supportEmail: "support@jerseyfit.in",
    });

    expect(updated.storeName).toBe("Jersey Fit Studio");
    expect(updated.gstRate).toBe(5.0);

    // Restore original
    await SettingsService.updateSettings(original);
  });
});
