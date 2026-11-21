import {
  boolean,
  decimal,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productFamilyEnum = pgEnum("product_family", ["customisable", "readymade"]);
export const categoryTypeEnum = pgEnum("category_type", ["custom", "premium", "readymade", "custom-tshirt"]);

export const categories = pgTable("categories", {
  slug: varchar("slug", { length: 100 }).primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  image: text("image").default("").notNull(),
  description: text("description").default("").notNull(),
  family: productFamilyEnum("family").notNull(),
  type: categoryTypeEnum("type").notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categorySlug: varchar("category_slug", { length: 100 })
      .notNull()
      .references(() => categories.slug, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description").default(""),
    image: text("image").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("cat_sub_slug_idx").on(t.categorySlug, t.slug)],
);

export const products = pgTable("products", {
  id: varchar("id", { length: 100 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  family: productFamilyEnum("family").notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 })
    .notNull()
    .references(() => categories.slug),
  subCategory: varchar("sub_category", { length: 100 }),
  price: integer("price").notNull(),
  mrp: integer("mrp").notNull(),
  material: varchar("material", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  overview: text("overview").default("").notNull(),
  washCare: text("wash_care").default("").notNull(),
  designGuidelines: text("design_guidelines").default("").notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.5").notNull(),
  tag: varchar("tag", { length: 100 }),
  isExclusiveTopWear: boolean("is_exclusive_top_wear").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  demo: boolean("demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: varchar("product_id", { length: 100 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
