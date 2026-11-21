import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./catalog.js";

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  storeName: varchar("store_name", { length: 255 }).default("Jersey Fit").notNull(),
  supportEmail: varchar("support_email", { length: 255 }).default("hello@jerseyfit.in").notNull(),
  supportPhone: varchar("support_phone", { length: 50 }).default("+91 98765 43210").notNull(),
  gstRate: numeric("gst_rate", { precision: 4, scale: 2 }).default("5.00").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customDesignOptions = pgTable("custom_design_options", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviewStatusEnum = pgEnum("review_status", [
  "Positive",
  "Neutral",
  "Needs attention",
]);

export const productReviews = pgTable("product_reviews", {
  id: varchar("id", { length: 100 }).primaryKey(),
  productId: varchar("product_id", { length: 100 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  status: reviewStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const showcaseCustomers = pgTable("showcase_customers", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  category: varchar("category", { length: 100 }),
  subCategory: varchar("sub_category", { length: 100 }),
  productId: varchar("product_id", { length: 100 }).references(() => products.id),
  demo: boolean("demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
