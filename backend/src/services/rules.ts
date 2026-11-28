import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { pricingRules, type DiscountTier, type PrintCharges } from "../db/schema/rules.js";
import { storeSettings } from "../db/schema/settings.js";

export const DEFAULT_DISCOUNT_TIERS: DiscountTier[] = [
  { min: 10, max: 22, pct: 10 },
  { min: 23, max: 40, pct: 20 },
  { min: 41, max: 70, pct: 30 },
  { min: 71, max: null, pct: 40 },
];

export const DEFAULT_PRINT_CHARGES: PrintCharges = {
  logo: 40,
  name: 30,
  number: 30,
};

export const DEFAULT_PRINT_DESCRIPTIONS = {
  logo: "Logo print per piece",
  name: "Name print per piece",
  number: "Number print per piece",
};

export const DEFAULT_RULES = {
  customisable: {
    family: "customisable" as const,
    moq: 5,
    maxQty: null,
    discountTiers: DEFAULT_DISCOUNT_TIERS,
    printCharges: DEFAULT_PRINT_CHARGES,
    printChargesByType: {
      "Sublimation Print": DEFAULT_PRINT_CHARGES,
      "DTF Print": DEFAULT_PRINT_CHARGES,
    },
    printDescriptionsByType: {
      "Sublimation Print": DEFAULT_PRINT_DESCRIPTIONS,
      "DTF Print": DEFAULT_PRINT_DESCRIPTIONS,
    },
    printTypes: ["Sublimation Print", "DTF Print", "No Print"],
    addOnsAllowed: { logo: true, name: true, number: true },
    rosterThreshold: 15,
  },
  readymade: {
    family: "readymade" as const,
    moq: 1,
    maxQty: 3,
    discountTiers: [] as DiscountTier[],
    printCharges: { logo: 0, name: 0, number: 0 },
    printChargesByType: {},
    printDescriptionsByType: {},
    printTypes: [] as string[],
    addOnsAllowed: { logo: false, name: false, number: false },
    rosterThreshold: 15,
  },
};

export type RuleKind = "discounts" | "moq" | "print-settings";

export const KIND_KEYS: Record<RuleKind, string[]> = {
  discounts: ["discountTiers"],
  moq: ["moq", "maxQty"],
  "print-settings": ["printTypes", "printChargesByType", "printDescriptionsByType", "printCharges", "addOnsAllowed", "rosterThreshold"],
};

export class RulesService {
  /**
   * Subcategory -> Category -> Global(Family) -> Hardcoded Default
   */
  static async resolvePricingConfig(product: {
    family: "customisable" | "readymade";
    category: string;
    subCategory?: string | null;
  }) {
    const base = DEFAULT_RULES[product.family];

    if (product.family === "readymade") {
      const allRules = await db.select().from(pricingRules);
      const catRule = allRules.find(
        (r) => r.scope === "category" && r.categorySlug === product.category,
      );
      const subRule = product.subCategory
        ? allRules.find(
            (r) =>
              r.scope === "subcategory" &&
              r.categorySlug === product.category &&
              r.subcategorySlug === product.subCategory,
          )
        : undefined;

      return {
        ...base,
        ...(catRule?.moq !== null && catRule?.moq !== undefined ? { moq: catRule.moq } : {}),
        ...(catRule?.maxQty !== null && catRule?.maxQty !== undefined ? { maxQty: catRule.maxQty } : {}),
        ...(subRule?.moq !== null && subRule?.moq !== undefined ? { moq: subRule.moq } : {}),
        ...(subRule?.maxQty !== null && subRule?.maxQty !== undefined ? { maxQty: subRule.maxQty } : {}),
        family: "readymade" as const,
        discountTiers: [],
        printTypes: [],
        addOnsAllowed: { logo: false, name: false, number: false },
        printCharges: { logo: 0, name: 0, number: 0 },
      };
    }

    // Customisable
    const allRules = await db.select().from(pricingRules);
    const globalRule = allRules.find(
      (r) => r.scope === "global" && r.family === "customisable",
    );
    const catRule = allRules.find(
      (r) => r.scope === "category" && r.categorySlug === product.category,
    );
    const subRule = product.subCategory
      ? allRules.find(
          (r) =>
            r.scope === "subcategory" &&
            r.categorySlug === product.category &&
            r.subcategorySlug === product.subCategory,
        )
      : undefined;

    const merged = {
      ...base,
      ...this.cleanRule(globalRule),
      ...this.cleanRule(catRule),
      ...this.cleanRule(subRule),
      family: "customisable" as const,
    };

    return merged;
  }

  private static cleanRule(rule?: typeof pricingRules.$inferSelect) {
    if (!rule) return {};
    const res: Record<string, unknown> = {};
    if (rule.moq !== null && rule.moq !== undefined) res.moq = rule.moq;
    if (rule.maxQty !== null && rule.maxQty !== undefined) res.maxQty = rule.maxQty;
    if (rule.discountTiers) res.discountTiers = rule.discountTiers;
    if (rule.printCharges) res.printCharges = rule.printCharges;
    if (rule.printChargesByType) res.printChargesByType = rule.printChargesByType;
    if (rule.printDescriptionsByType) res.printDescriptionsByType = rule.printDescriptionsByType;
    if (rule.printTypes) res.printTypes = rule.printTypes;
    if (rule.addOnsAllowed) res.addOnsAllowed = rule.addOnsAllowed;
    if (rule.rosterThreshold !== null && rule.rosterThreshold !== undefined)
      res.rosterThreshold = rule.rosterThreshold;
    return res;
  }

    static async listRules() {
    return await db.select().from(pricingRules);
  }
  static async saveRule(params: {
    scope: "global" | "category" | "subcategory";
    family: "customisable" | "readymade";
    categorySlug?: string;
    subcategorySlug?: string;
    kind: RuleKind;
    values: Partial<typeof DEFAULT_RULES.customisable>;
  }) {
    const existing = await db.select().from(pricingRules);
    const match = existing.find(
      (r) =>
        r.scope === params.scope &&
        r.family === params.family &&
        (r.categorySlug ?? undefined) === params.categorySlug &&
        (r.subcategorySlug ?? undefined) === params.subcategorySlug,
    );

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const key of KIND_KEYS[params.kind]) {
      if (key in params.values) {
        updatePayload[key] = (params.values as Record<string, unknown>)[key];
      }
    }

    if (match) {
      await db
        .update(pricingRules)
        .set(updatePayload)
        .where(eq(pricingRules.id, match.id));
    } else {
      await db.insert(pricingRules).values({
        scope: params.scope,
        family: params.family,
        categorySlug: params.categorySlug,
        subcategorySlug: params.subcategorySlug,
        ...updatePayload,
      });
    }

    return { success: true };
  }

  static async resetRule(params: {
    scope: "category" | "subcategory";
    family: "customisable" | "readymade";
    categorySlug: string;
    subcategorySlug?: string;
    kind: RuleKind;
  }) {
    const existing = await db.select().from(pricingRules);
    const match = existing.find(
      (r) =>
        r.scope === params.scope &&
        r.family === params.family &&
        r.categorySlug === params.categorySlug &&
        (r.subcategorySlug ?? undefined) === params.subcategorySlug,
    );

    if (!match) return { success: true };

    const resetPayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    for (const key of KIND_KEYS[params.kind]) {
      resetPayload[key] = null;
    }

    await db
      .update(pricingRules)
      .set(resetPayload)
      .where(eq(pricingRules.id, match.id));

    return { success: true };
  }
}
