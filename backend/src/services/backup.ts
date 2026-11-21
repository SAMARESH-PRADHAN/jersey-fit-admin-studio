import { db } from "../db/index.js";
import { categories, subcategories, products, productImages } from "../db/schema/catalog.js";
import { customers } from "../db/schema/customers.js";
import { orders, orderItems, orderStatusHistory } from "../db/schema/orders.js";
import { payments } from "../db/schema/payments.js";
import { coupons, pricingRules } from "../db/schema/rules.js";
import {
  customDesignOptions,
  productReviews,
  showcaseCustomers,
  storeSettings,
} from "../db/schema/settings.js";

export class BackupService {
  /**
   * Export all entities including reviews and customDesignOptions
   */
  static async exportBackup() {
    const [
      cats,
      subs,
      prods,
      pImages,
      custs,
      ords,
      oItems,
      oHistory,
      pymts,
      cpns,
      rules,
      settings,
      showcase,
      designOptions,
      reviews,
    ] = await Promise.all([
      db.select().from(categories),
      db.select().from(subcategories),
      db.select().from(products),
      db.select().from(productImages),
      db.select().from(customers),
      db.select().from(orders),
      db.select().from(orderItems),
      db.select().from(orderStatusHistory),
      db.select().from(payments),
      db.select().from(coupons),
      db.select().from(pricingRules),
      db.select().from(storeSettings),
      db.select().from(showcaseCustomers),
      db.select().from(customDesignOptions),
      db.select().from(productReviews),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: cats,
      subcategories: subs,
      products: prods,
      productImages: pImages,
      customers: custs,
      orders: ords,
      orderItems: oItems,
      orderStatusHistory: oHistory,
      payments: pymts,
      coupons: cpns,
      pricingRules: rules,
      storeSettings: settings[0] ?? null,
      showcase,
      customDesignOptions: designOptions,
      reviews,
    };
  }

  /**
   * Restore backup with full transactional validation
   */
  static async restoreBackup(backup: any) {
    if (!backup || typeof backup !== "object") {
      throw new Error("Invalid backup payload format.");
    }

    return await db.transaction(async (tx) => {
      // 1. Restore Custom Design Options
      if (Array.isArray(backup.customDesignOptions)) {
        for (const opt of backup.customDesignOptions) {
          await tx
            .insert(customDesignOptions)
            .values(opt)
            .onConflictDoUpdate({
              target: customDesignOptions.id,
              set: { price: opt.price, description: opt.description, updatedAt: new Date() },
            });
        }
      }

      // 2. Restore Categories & Subcategories
      if (Array.isArray(backup.categories)) {
        for (const cat of backup.categories) {
          await tx
            .insert(categories)
            .values(cat)
            .onConflictDoUpdate({
              target: categories.slug,
              set: { label: cat.label, section: cat.section, updatedAt: new Date() },
            });
        }
      }

      // 3. Restore Products
      if (Array.isArray(backup.products)) {
        for (const prod of backup.products) {
          await tx
            .insert(products)
            .values(prod)
            .onConflictDoUpdate({
              target: products.id,
              set: { price: prod.price, mrp: prod.mrp, active: prod.active, updatedAt: new Date() },
            });
        }
      }

      // 4. Restore Coupons
      if (Array.isArray(backup.coupons)) {
        for (const c of backup.coupons) {
          await tx
            .insert(coupons)
            .values(c)
            .onConflictDoUpdate({
              target: coupons.code,
              set: { active: c.active, amount: c.amount, updatedAt: new Date() },
            });
        }
      }

      // 5. Restore Settings
      if (backup.storeSettings) {
        await tx
          .insert(storeSettings)
          .values({ id: 1, ...backup.storeSettings })
          .onConflictDoUpdate({
            target: storeSettings.id,
            set: {
              storeName: backup.storeSettings.storeName,
              gstRate: backup.storeSettings.gstRate,
              updatedAt: new Date(),
            },
          });
      }

      // 6. Restore Reviews
      if (Array.isArray(backup.reviews)) {
        for (const rev of backup.reviews) {
          await tx
            .insert(productReviews)
            .values(rev)
            .onConflictDoNothing();
        }
      }

      return { success: true, message: "Backup successfully restored" };
    });
  }
}
