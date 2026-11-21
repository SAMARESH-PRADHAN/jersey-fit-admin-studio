import { describe, expect, it } from "vitest";

describe("Coupon Validation Rules", () => {
  interface Coupon {
    code: string;
    amount: number;
    discountType: "flat" | "percentage";
    minimumSubtotal: number;
    active: boolean;
    startsAt: Date;
    expiresAt: Date | null;
    usageLimit: number | null;
    usageCount: number;
  }

  const validateCoupon = (coupon: Coupon | null, subtotal: number, now = new Date()) => {
    if (!coupon) return { valid: false, reason: "Not found" };
    if (!coupon.active) return { valid: false, reason: "Inactive" };
    if (now < coupon.startsAt) return { valid: false, reason: "Not yet started" };
    if (coupon.expiresAt && now > coupon.expiresAt) return { valid: false, reason: "Expired" };
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, reason: "Usage limit reached" };
    }
    if (subtotal < coupon.minimumSubtotal) {
      return { valid: false, reason: `Minimum subtotal not met: ${coupon.minimumSubtotal}` };
    }

    const discount =
      coupon.discountType === "percentage"
        ? Math.round((subtotal * coupon.amount) / 100)
        : Math.min(coupon.amount, subtotal);

    return { valid: true, discount };
  };

  const sampleCoupon: Coupon = {
    code: "FIT200",
    amount: 200,
    discountType: "flat",
    minimumSubtotal: 2000,
    active: true,
    startsAt: new Date("2026-01-01"),
    expiresAt: new Date("2027-12-31"),
    usageLimit: 10,
    usageCount: 0,
  };

  it("rejects when subtotal is below minimumSubtotal", () => {
    const res = validateCoupon(sampleCoupon, 1999);
    expect(res.valid).toBe(false);
  });

  it("accepts and applies flat discount when subtotal meets minimum", () => {
    const res = validateCoupon(sampleCoupon, 2500);
    expect(res.valid).toBe(true);
    expect(res.discount).toBe(200);
  });

  it("rejects when coupon is inactive", () => {
    const res = validateCoupon({ ...sampleCoupon, active: false }, 3000);
    expect(res.valid).toBe(false);
  });

  it("rejects when expired", () => {
    const res = validateCoupon(
      { ...sampleCoupon, expiresAt: new Date("2025-01-01") },
      3000,
      new Date("2026-02-01"),
    );
    expect(res.valid).toBe(false);
  });

  it("rejects when usage limit is reached", () => {
    const res = validateCoupon(
      { ...sampleCoupon, usageCount: 10, usageLimit: 10 },
      3000,
    );
    expect(res.valid).toBe(false);
  });
});
