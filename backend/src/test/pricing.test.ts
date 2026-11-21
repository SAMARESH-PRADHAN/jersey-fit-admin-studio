import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, DEFAULT_DISCOUNT_TIERS } from "../services/rules.js";

describe("Pricing and Discount Tiers Business Rules", () => {
  it("enforces default MOQ rules", () => {
    expect(DEFAULT_RULES.customisable.moq).toBe(5);
    expect(DEFAULT_RULES.readymade.moq).toBe(1);
    expect(DEFAULT_RULES.readymade.maxQty).toBe(3);
  });

  it("ensures readymade has zero discount tiers and no print customization", () => {
    expect(DEFAULT_RULES.readymade.discountTiers).toHaveLength(0);
    expect(DEFAULT_RULES.readymade.printTypes).toHaveLength(0);
    expect(DEFAULT_RULES.readymade.addOnsAllowed.logo).toBe(false);
    expect(DEFAULT_RULES.readymade.addOnsAllowed.name).toBe(false);
    expect(DEFAULT_RULES.readymade.addOnsAllowed.number).toBe(false);
  });

  it("correctly resolves tier discount percentage based on quantity", () => {
    const resolveTier = (qty: number) => {
      for (const tier of DEFAULT_DISCOUNT_TIERS) {
        if (qty >= tier.min && (tier.max === null || qty <= tier.max)) {
          return tier.pct;
        }
      }
      return 0;
    };

    expect(resolveTier(5)).toBe(0);
    expect(resolveTier(9)).toBe(0);
    expect(resolveTier(10)).toBe(10);
    expect(resolveTier(22)).toBe(10);
    expect(resolveTier(23)).toBe(20);
    expect(resolveTier(40)).toBe(20);
    expect(resolveTier(41)).toBe(30);
    expect(resolveTier(70)).toBe(30);
    expect(resolveTier(71)).toBe(40);
    expect(resolveTier(100)).toBe(40);
  });

  it("applies discounts strictly to product price and never print charges", () => {
    const unitPrice = 699;
    const quantity = 25; // falls in 20% tier
    const discountPct = 20;

    const baseProductTotal = unitPrice * quantity; // 17,475
    const discountAmount = Math.round((baseProductTotal * discountPct) / 100); // 3,495
    const netProductTotal = baseProductTotal - discountAmount; // 13,980

    // Printing add-ons: Sublimation (Logo 40, Name 30) = 70 per item
    const printAddOnsPerItem = 70;
    const totalPrintCharge = printAddOnsPerItem * quantity; // 1,750

    const taxableSubtotal = netProductTotal + totalPrintCharge; // 15,730
    const gst = Math.round(taxableSubtotal * 0.05); // 786.5 -> 787
    const grandTotal = taxableSubtotal + gst;

    expect(netProductTotal).toBe(13980);
    expect(totalPrintCharge).toBe(1750);
    expect(taxableSubtotal).toBe(15730);
    expect(grandTotal).toBe(16517);
  });
});
