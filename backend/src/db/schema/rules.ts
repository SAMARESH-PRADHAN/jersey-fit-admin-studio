import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categories, productFamilyEnum } from "./catalog.js";

export const ruleScopeEnum = pgEnum("rule_scope", ["global", "category", "subcategory"]);

export interface DiscountTier {
  min: number;
  max: number | null;
  pct: number;
}

export interface PrintCharges {
  logo: number;
  name: number;
  number: number;
}

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: ruleScopeEnum("scope").notNull(),
    family: productFamilyEnum("family").notNull(),
    categorySlug: varchar("category_slug", { length: 100 }),
    subcategorySlug: varchar("subcategory_slug", { length: 100 }),
    moq: integer("moq"),
    maxQty: integer("max_qty"),
    discountTiers: jsonb("discount_tiers").$type<DiscountTier[]>(),
    printCharges: jsonb("print_charges").$type<PrintCharges>(),
    printChargesByType: jsonb("print_charges_by_type").$type<Record<string, PrintCharges>>(),
    printDescriptionsByType: jsonb("print_descriptions_by_type").$type<Record<string, { logo: string; name: string; number: string }>>(),
    printTypes: jsonb("print_types").$type<string[]>(),
    addOnsAllowed: jsonb("add_ons_allowed").$type<{ logo: boolean; name: boolean; number: boolean }>(),
    rosterThreshold: integer("roster_threshold"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("pricing_rule_target_idx").on(t.scope, t.family, t.categorySlug, t.subcategorySlug),
  ],
);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", ["flat", "percentage"]);

export const coupons = pgTable("coupons", {
  code: varchar("code", { length: 50 }).primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  discountType: couponDiscountTypeEnum("discount_type").notNull(),
  minimumSubtotal: integer("minimum_subtotal").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
