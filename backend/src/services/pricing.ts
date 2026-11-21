import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { products } from "../db/schema/catalog.js";
import { storeSettings } from "../db/schema/settings.js";
import { CouponService } from "./coupons.js";
import { RulesService } from "./rules.js";
import type { cartItemInputSchema } from "../validators/index.js";
import type { z } from "zod";

export interface PricedCartItem {
  productId: string;
  productName: string;
  family: "customisable" | "readymade";
  section: string;
  category: string;
  subCategory?: string;
  quantity: number;
  unitPrice: number;
  baseTotal: number;
  discountPct: number;
  discountAmount: number;
  printChargePerItem: number;
  totalPrintCharge: number;
  itemTotal: number;
  size: string;
  printType?: string;
  addOns?: string[];
  names?: string[];
  numbers?: string[];
  note?: string;
  logoFileUrl?: string;
  rosterFileUrl?: string;
  rosterFileName?: string;
}

export interface CartPricingBreakdown {
  items: PricedCartItem[];
  itemsBaseSubtotal: number;
  totalTierDiscount: number;
  totalPrintCharges: number;
  subtotal: number;
  couponDiscount: number;
  couponCode?: string;
  taxableSubtotal: number;
  gstRate: number;
  gst: number;
  total: number;
}

export class PricingEngine {
  static async priceCart(
    cartItems: Array<z.infer<typeof cartItemInputSchema>>,
    couponCode?: string,
  ): Promise<CartPricingBreakdown> {
    const [settings] = await db.select().from(storeSettings).limit(1);
    const gstRate = settings ? Number(settings.gstRate) : 5.0;

    let itemsBaseSubtotal = 0;
    let totalTierDiscount = 0;
    let totalPrintCharges = 0;

    const pricedItems: PricedCartItem[] = [];

    for (const item of cartItems) {
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (!prod.active) {
        throw new Error(`Product is no longer available: ${prod.name}`);
      }

      const config = await RulesService.resolvePricingConfig({
        family: prod.family,
        category: prod.category,
        subCategory: prod.subCategory,
      });

      // Enforce MOQ & MaxQty
      if (item.quantity < config.moq) {
        throw new Error(
          `Minimum order quantity for ${prod.name} is ${config.moq} (you selected ${item.quantity}).`,
        );
      }
      if (config.maxQty !== null && item.quantity > config.maxQty) {
        throw new Error(
          `Maximum order quantity for ${prod.name} is ${config.maxQty} (you selected ${item.quantity}).`,
        );
      }

      // Check roster requirement
      if (
        prod.family === "customisable" &&
        item.quantity > config.rosterThreshold &&
        !item.rosterFileUrl
      ) {
        // Enforced warning or requirement
      }

      // Calculate tier discount (applied strictly to product unit price)
      let discountPct = 0;
      if (prod.family === "customisable" && config.discountTiers.length > 0) {
        for (const tier of config.discountTiers) {
          if (
            item.quantity >= tier.min &&
            (tier.max === null || item.quantity <= tier.max)
          ) {
            discountPct = tier.pct;
            break;
          }
        }
      }

      const baseTotal = prod.price * item.quantity;
      const discountAmount = Math.round((baseTotal * discountPct) / 100);

      // Print & add-on charges
      let printChargePerItem = 0;
      if (prod.family === "customisable" && item.printType && item.printType !== "No Print") {
        const chargesByType = config.printChargesByType as Record<string, typeof config.printCharges> | undefined;
        const typeCharges = (chargesByType && chargesByType[item.printType]) ? chargesByType[item.printType] : config.printCharges;
        if (item.addOns && item.addOns.length > 0) {
          for (const addon of item.addOns) {
            const lower = addon.toLowerCase() as "logo" | "name" | "number";
            if (lower in typeCharges) {
              printChargePerItem += typeCharges[lower] ?? 0;
            }
          }
        }
      }

      const totalItemPrintCharge = printChargePerItem * item.quantity;
      const itemTotal = baseTotal - discountAmount + totalItemPrintCharge;

      itemsBaseSubtotal += baseTotal;
      totalTierDiscount += discountAmount;
      totalPrintCharges += totalItemPrintCharge;

      pricedItems.push({
        productId: prod.id,
        productName: prod.name,
        family: prod.family,
        section: prod.section,
        category: prod.category,
        subCategory: prod.subCategory ?? undefined,
        quantity: item.quantity,
        unitPrice: prod.price,
        baseTotal,
        discountPct,
        discountAmount,
        printChargePerItem,
        totalPrintCharge: totalItemPrintCharge,
        itemTotal,
        size: item.size,
        printType: item.printType,
        addOns: item.addOns,
        names: item.names,
        numbers: item.numbers,
        note: item.note,
        logoFileUrl: item.logoFileUrl,
        rosterFileUrl: item.rosterFileUrl,
        rosterFileName: item.rosterFileName,
      });
    }

    const subtotal = itemsBaseSubtotal + totalPrintCharges;

    // Coupon validation & calculation
    let couponDiscount = 0;
    let appliedCoupon: string | undefined = undefined;

    if (couponCode) {
      const validation = await CouponService.validate(couponCode, subtotal - totalTierDiscount);
      if (validation.valid) {
        couponDiscount = validation.discount;
        appliedCoupon = validation.coupon?.code;
      }
    }

    const taxableSubtotal = Math.max(0, subtotal - totalTierDiscount - couponDiscount);
    const gst = Math.round((taxableSubtotal * gstRate) / 100);
    const total = taxableSubtotal + gst;

    return {
      items: pricedItems,
      itemsBaseSubtotal,
      totalTierDiscount,
      totalPrintCharges,
      subtotal,
      couponDiscount,
      couponCode: appliedCoupon,
      taxableSubtotal,
      gstRate,
      gst,
      total,
    };
  }
}
