import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  customDesignOptions,
  productReviews,
  showcaseCustomers,
  storeSettings,
} from "../db/schema/settings.js";

export class SettingsService {
  static async getSettings() {
    const [settings] = await db.select().from(storeSettings).limit(1);
    if (!settings) {
      return {
        storeName: "Jersey Fit",
        supportEmail: "hello@jerseyfit.in",
        supportPhone: "+91 98765 43210",
        gstRate: 5.0,
      };
    }
    return {
      storeName: settings.storeName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      gstRate: Number(settings.gstRate),
    };
  }

  static async updateSettings(input: {
    storeName?: string;
    supportEmail?: string;
    supportPhone?: string;
    gstRate?: number;
  }) {
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (input.storeName !== undefined) updatePayload.storeName = input.storeName;
    if (input.supportEmail !== undefined) updatePayload.supportEmail = input.supportEmail;
    if (input.supportPhone !== undefined) updatePayload.supportPhone = input.supportPhone;
    if (input.gstRate !== undefined) updatePayload.gstRate = String(input.gstRate);

    await db
      .insert(storeSettings)
      .values({
        id: 1,
        storeName: input.storeName ?? "Jersey Fit",
        supportEmail: input.supportEmail ?? "hello@jerseyfit.in",
        supportPhone: input.supportPhone ?? "+91 98765 43210",
        gstRate: String(input.gstRate ?? 5.0),
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: updatePayload,
      });

    return await this.getSettings();
  }

  // --- Custom Design Options ---
  static async listCustomDesignOptions() {
    return await db.select().from(customDesignOptions);
  }

  static async updateCustomDesignOption(
    id: string,
    input: { price?: number; description?: string },
  ) {
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (input.price !== undefined) updatePayload.price = input.price;
    if (input.description !== undefined) updatePayload.description = input.description;

    const [option] = await db
      .update(customDesignOptions)
      .set(updatePayload)
      .where(eq(customDesignOptions.id, id))
      .returning();

    return option;
  }

  // --- Product Reviews ---
  static async listReviews(productId?: string) {
    const all = await db.select().from(productReviews);
    if (!productId) return all;
    return all.filter((r) => r.productId === productId);
  }

  static async createReview(input: {
    productId: string;
    productName: string;
    customerName: string;
    rating: number;
    text: string;
  }) {
    const status: "Positive" | "Neutral" | "Needs attention" =
      input.rating >= 4 ? "Positive" : input.rating === 3 ? "Neutral" : "Needs attention";

    const id = `review-${Date.now()}`;
    const [review] = await db
      .insert(productReviews)
      .values({
        id,
        productId: input.productId,
        productName: input.productName,
        customerName: input.customerName,
        rating: input.rating,
        text: input.text,
        status,
        date: new Date(),
      })
      .returning();

    return review;
  }

  static async deleteReview(id: string) {
    await db.delete(productReviews).where(eq(productReviews.id, id));
    return { success: true };
  }

  // --- Showcase ---
  static async listShowcase() {
    return await db.select().from(showcaseCustomers);
  }

  static async createShowcase(input: {
    name: string;
    location: string;
    description: string;
    image: string;
    category?: string;
    subCategory?: string;
    productId?: string;
  }) {
    const id = `showcase-${Date.now()}`;
    const [story] = await db
      .insert(showcaseCustomers)
      .values({
        id,
        name: input.name,
        location: input.location,
        description: input.description,
        image: input.image,
        category: input.category,
        subCategory: input.subCategory,
        productId: input.productId,
      })
      .returning();

    return story;
  }

  static async deleteShowcase(id: string) {
    await db.delete(showcaseCustomers).where(eq(showcaseCustomers.id, id));
    return { success: true };
  }
}
