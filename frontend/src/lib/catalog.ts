import { CUSTOM_DESIGN_OPTIONS, DEFAULT_DISCOUNT_TIERS, SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/products";
import { KEYS, readStored } from "@/lib/storage";
import type { CategoryRegistryItem, Coupon, PricingConfig, Product, ProductFamily, ShowcaseCustomer } from "@/types";

// export function getProducts(): Product[] {
//   return readStored(KEYS.products, SEED_PRODUCTS);
// }
export function getProducts(): Product[] {
  return readStored(KEYS.products, []);
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((product) => product.id === id);
}

// export function getCategories(): CategoryRegistryItem[] {
//   return readStored(KEYS.categories, SEED_CATEGORIES);
// }

export function getCategories(): CategoryRegistryItem[] {
  return readStored(KEYS.categories, []);
}
const DEFAULT_RULES: Record<ProductFamily, PricingConfig> = {
  customisable: {
    family: "customisable", moq: 5, maxQty: null, discountTiers: DEFAULT_DISCOUNT_TIERS,
    printCharges: { logo: 40, name: 30, number: 30 },
    printTypes: ["Sublimation Print", "DTF Print", "No Print"],
    addOnsAllowed: { logo: true, name: true, number: true }, rosterThreshold: 15,
  },
  readymade: {
    family: "readymade", moq: 1, maxQty: 3, discountTiers: [],
    printCharges: { logo: 0, name: 0, number: 0 }, printTypes: [],
    addOnsAllowed: { logo: false, name: false, number: false }, rosterThreshold: 15,
  },
};

export function resolvePricingConfig(product: Pick<Product, "family" | "category" | "subCategory">): PricingConfig {
  const base = DEFAULT_RULES[product.family];
  if (product.family === "readymade") {
    const settings = readStored<{ categoryRules?: Record<string, Partial<PricingConfig>>; subcategoryRules?: Record<string, Partial<PricingConfig>> }>(KEYS.settings, {});
    const category = settings.categoryRules?.[product.category];
    const subcategory = product.subCategory ? settings.subcategoryRules?.[`${product.category}:${product.subCategory}`] : undefined;
    return { ...base, ...category, ...subcategory, family: "readymade", discountTiers: [], printTypes: [], addOnsAllowed: { logo: false, name: false, number: false }, printCharges: { logo: 0, name: 0, number: 0 } };
  }
  const settings = readStored<{ globalRules?: Partial<Record<ProductFamily, Partial<PricingConfig>>>; categoryRules?: Record<string, Partial<PricingConfig>>; subcategoryRules?: Record<string, Partial<PricingConfig>> }>(KEYS.settings, {});
  const category = settings.categoryRules?.[product.category];
  const subcategory = product.subCategory ? settings.subcategoryRules?.[`${product.category}:${product.subCategory}`] : undefined;
  return { ...base, ...settings.globalRules?.customisable, ...category, ...subcategory, family: "customisable" };
}

export function getCoupons(): Coupon[] {
  return readStored(KEYS.coupons, [
    // { code: "JERSEY100", label: "Save ₹100", amount: 100, discountType: "flat", minimumSubtotal: 0, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: null, usageCount: 0 },
    // { code: "FIT200", label: "₹200 off above ₹2,000", amount: 200, discountType: "flat", minimumSubtotal: 2000, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: null, usageCount: 0 },
    // { code: "SQUAD500", label: "₹500 off above ₹6,000", amount: 500, discountType: "flat", minimumSubtotal: 6000, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: null, usageCount: 0 },
  ]);
}

export function getGstRate(): number {
  return readStored(KEYS.settings, { gstRate: 5 }).gstRate;
}

export function getShowcaseCustomers(): ShowcaseCustomer[] {
  return readStored(KEYS.showcase, []);
}

// export function getCustomDesignOptions() {
//   return readStored(KEYS.customDesignOptions, CUSTOM_DESIGN_OPTIONS);
// }
export function getCustomDesignOptions() {
  return readStored(KEYS.customDesignOptions, []);
}

export function familyForCategory(slug: string): ProductFamily | undefined {
  return getCategories().find((category) => category.slug === slug)?.family;
}

export const FALLBACK_CATEGORIES = SEED_CATEGORIES;