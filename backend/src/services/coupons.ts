import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { coupons } from "../db/schema/rules.js";
import type { couponInputSchema } from "../validators/index.js";
import type { z } from "zod";

export class CouponService {
  static async list() {
    return await db.select().from(coupons);
  }

  static async create(input: z.infer<typeof couponInputSchema>) {
    const code = input.code.trim().toUpperCase();

    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        label: input.label,
        amount: input.amount,
        discountType: input.discountType,
        minimumSubtotal: input.minimumSubtotal,
        active: input.active,
        startsAt: new Date(input.startsAt),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        usageLimit: input.usageLimit ?? null,
        usageCount: 0,
      })
      .onConflictDoUpdate({
        target: coupons.code,
        set: {
          label: input.label,
          amount: input.amount,
          discountType: input.discountType,
          minimumSubtotal: input.minimumSubtotal,
          active: input.active,
          startsAt: new Date(input.startsAt),
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          usageLimit: input.usageLimit ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return coupon;
  }

  static async update(code: string, input: Partial<z.infer<typeof couponInputSchema>>) {
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (input.label) updatePayload.label = input.label;
    if (input.amount !== undefined) updatePayload.amount = input.amount;
    if (input.discountType) updatePayload.discountType = input.discountType;
    if (input.minimumSubtotal !== undefined) updatePayload.minimumSubtotal = input.minimumSubtotal;
    if (input.active !== undefined) updatePayload.active = input.active;
    if (input.startsAt) updatePayload.startsAt = new Date(input.startsAt);
    if (input.expiresAt !== undefined)
      updatePayload.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (input.usageLimit !== undefined) updatePayload.usageLimit = input.usageLimit;

    const [coupon] = await db
      .update(coupons)
      .set(updatePayload)
      .where(eq(coupons.code, code.toUpperCase()))
      .returning();

    return coupon;
  }

  static async toggleActive(code: string, active: boolean) {
    const [coupon] = await db
      .update(coupons)
      .set({ active, updatedAt: new Date() })
      .where(eq(coupons.code, code.toUpperCase()))
      .returning();
    return coupon;
  }

  static async delete(code: string) {
    await db.delete(coupons).where(eq(coupons.code, code.toUpperCase()));
    return { success: true };
  }

  static async validate(code: string, subtotal: number) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.trim().toUpperCase()))
      .limit(1);

    if (!coupon) {
      return { valid: false, discount: 0, reason: "Coupon does not exist" };
    }

    if (!coupon.active) {
      return { valid: false, discount: 0, reason: "Coupon is currently paused" };
    }

    const now = new Date();
    if (now < new Date(coupon.startsAt)) {
      return { valid: false, discount: 0, reason: "Coupon is not yet active" };
    }

    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
      return { valid: false, discount: 0, reason: "Coupon has expired" };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, reason: "Coupon usage limit reached" };
    }

    if (subtotal < coupon.minimumSubtotal) {
      return {
        valid: false,
        discount: 0,
        reason: `Subtotal must be at least ₹${coupon.minimumSubtotal} to apply this coupon`,
      };
    }

    const discount =
      coupon.discountType === "percentage"
        ? Math.round((subtotal * coupon.amount) / 100)
        : Math.min(coupon.amount, subtotal);

    return {
      valid: true,
      discount,
      coupon,
    };
  }
}
