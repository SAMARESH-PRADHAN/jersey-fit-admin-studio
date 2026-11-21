import { boolean, integer, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { orders, paymentMethodEnum, payModeEnum } from "./orders.js";

export const paymentStatusEnum = pgEnum("payment_status", ["Collected", "Pending"]);

export const payments = pgTable("payments", {
  id: varchar("id", { length: 100 }).primaryKey(),
  orderId: varchar("order_id", { length: 50 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  mode: payModeEnum("mode").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  status: paymentStatusEnum("status").notNull(),
  demo: boolean("demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
