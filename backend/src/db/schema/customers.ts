import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
  demo: boolean("demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
