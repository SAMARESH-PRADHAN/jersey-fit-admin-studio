import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers.js";
import { productFamilyEnum, products } from "./catalog.js";

export type OrderStatus =
  | "Placed"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

export const orderStatusEnum = pgEnum("order_status", [
  "Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "UPI",
  "Card",
  "Net Banking",
  "COD",
]);

export const payModeEnum = pgEnum("pay_mode", ["full", "advance"]);

export interface OrderAddress {
  line: string;
  city: string;
  state: string;
  pincode: string;
  company?: string;
  gstin?: string;
}

export const orders = pgTable("orders", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: varchar("user_id", { length: 100 })
    .notNull()
    .references(() => customers.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  address: jsonb("address").$type<OrderAddress>().notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  payMode: payModeEnum("pay_mode").notNull(),
  amountPaid: integer("amount_paid").notNull(),
  balancePaid: integer("balance_paid").notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0).notNull(),
  coupon: varchar("coupon", { length: 50 }),
  gst: integer("gst").notNull(),
  total: integer("total").notNull(),
  status: orderStatusEnum("status").notNull().default("Placed"),
  statusIndex: integer("status_index").notNull().default(0),
  demo: boolean("demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: varchar("order_id", { length: 50 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 100 })
    .references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  family: productFamilyEnum("family").notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  printType: varchar("print_type", { length: 100 }),
  addOns: jsonb("add_ons").$type<string[]>(),
  logoFileUrl: text("logo_file_url"),
  rosterFileUrl: text("roster_file_url"),
  rosterFileName: varchar("roster_file_name", { length: 255 }),
  names: jsonb("names").$type<string[]>(),
  numbers: jsonb("numbers").$type<string[]>(),
  note: text("note"),
  discountPct: numeric("discount_pct", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: varchar("order_id", { length: 50 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  note: text("note"),
});
