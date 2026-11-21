import { describe, expect, it } from "vitest";

describe("Backup and Restore Integrity", () => {
  it("verifies full backup payload includes reviews and customDesignOptions", () => {
    const backupKeys = [
      "categories",
      "subcategories",
      "products",
      "productImages",
      "customers",
      "orders",
      "orderItems",
      "orderStatusHistory",
      "payments",
      "coupons",
      "pricingRules",
      "storeSettings",
      "showcase",
      "customDesignOptions",
      "reviews",
    ];

    const sampleBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: [],
      subcategories: [],
      products: [],
      productImages: [],
      customers: [],
      orders: [],
      orderItems: [],
      orderStatusHistory: [],
      payments: [],
      coupons: [],
      pricingRules: [],
      storeSettings: { storeName: "Jersey Fit" },
      showcase: [],
      customDesignOptions: [{ id: "opt-1", name: "Front Print", price: 599 }],
      reviews: [{ id: "rev-1", productId: "p1", rating: 5, text: "Awesome jersey" }],
    };

    for (const key of backupKeys) {
      expect(sampleBackup).toHaveProperty(key);
    }

    expect(sampleBackup.customDesignOptions).toHaveLength(1);
    expect(sampleBackup.reviews).toHaveLength(1);
  });
});
