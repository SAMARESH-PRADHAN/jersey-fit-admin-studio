import { describe, expect, it } from "vitest";

describe("Rule Inheritance Hierarchy", () => {
  interface RuleConfig {
    moq: number;
    maxQty?: number | null;
    printTypes: string[];
    discountTiers: Array<{ min: number; max: number | null; pct: number }>;
  }

  const globalDefaults: RuleConfig = {
    moq: 5,
    maxQty: null,
    printTypes: ["Sublimation Print", "DTF Print"],
    discountTiers: [{ min: 10, max: 22, pct: 10 }],
  };

  const categoryOverrides: Record<string, Partial<RuleConfig>> = {
    "custom-team-jersey": {
      moq: 6,
    },
  };

  const subcategoryOverrides: Record<string, Partial<RuleConfig>> = {
    "custom-team-jersey:cricket": {
      moq: 11,
      discountTiers: [{ min: 10, max: 20, pct: 15 }],
    },
  };

  const resolveRule = (category: string, subcategory?: string): RuleConfig => {
    const cat = categoryOverrides[category] ?? {};
    const sub = subcategory ? subcategoryOverrides[`${category}:${subcategory}`] ?? {} : {};
    return {
      ...globalDefaults,
      ...cat,
      ...sub,
    };
  };

  it("inherits global defaults when no category or subcategory overrides exist", () => {
    const resolved = resolveRule("custom-premium");
    expect(resolved.moq).toBe(5);
    expect(resolved.discountTiers[0]?.pct).toBe(10);
  });

  it("overrides global defaults with category rules", () => {
    const resolved = resolveRule("custom-team-jersey");
    expect(resolved.moq).toBe(6);
    expect(resolved.discountTiers[0]?.pct).toBe(10); // remains global
  });

  it("overrides category rules with subcategory rules", () => {
    const resolved = resolveRule("custom-team-jersey", "cricket");
    expect(resolved.moq).toBe(11); // from subcategory
    expect(resolved.discountTiers[0]?.pct).toBe(15); // from subcategory
    expect(resolved.printTypes).toHaveLength(2); // inherited from global
  });
});
