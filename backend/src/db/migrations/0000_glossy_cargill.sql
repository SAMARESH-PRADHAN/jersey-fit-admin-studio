CREATE TYPE "public"."admin_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('custom', 'premium', 'readymade', 'custom-tshirt');--> statement-breakpoint
CREATE TYPE "public"."product_family" AS ENUM('customisable', 'readymade');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('flat', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."rule_scope" AS ENUM('global', 'category', 'subcategory');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered');--> statement-breakpoint
CREATE TYPE "public"."pay_mode" AS ENUM('full', 'advance');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('UPI', 'Card', 'Net Banking', 'COD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('Collected', 'Pending');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('Positive', 'Neutral', 'Needs attention');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"slug" varchar(100) PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"family" "product_family" NOT NULL,
	"type" "category_type" NOT NULL,
	"section" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"family" "product_family" NOT NULL,
	"section" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"sub_category" varchar(100),
	"price" integer NOT NULL,
	"mrp" integer NOT NULL,
	"material" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"wash_care" text DEFAULT '' NOT NULL,
	"design_guidelines" text DEFAULT '' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '4.5' NOT NULL,
	"tag" varchar(100),
	"is_exclusive_top_wear" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_slug" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"image" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cat_sub_slug_idx" UNIQUE("category_slug","slug")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"discount_type" "coupon_discount_type" NOT NULL,
	"minimum_subtotal" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "rule_scope" NOT NULL,
	"family" "product_family" NOT NULL,
	"category_slug" varchar(100),
	"subcategory_slug" varchar(100),
	"moq" integer,
	"max_qty" integer,
	"discount_tiers" jsonb,
	"print_charges" jsonb,
	"print_charges_by_type" jsonb,
	"print_descriptions_by_type" jsonb,
	"print_types" jsonb,
	"add_ons_allowed" jsonb,
	"roster_threshold" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_rule_target_idx" UNIQUE("scope","family","category_slug","subcategory_slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"city" varchar(100) NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"product_id" varchar(100) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"family" "product_family" NOT NULL,
	"section" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"sub_category" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"size" varchar(20) NOT NULL,
	"print_type" varchar(100),
	"add_ons" jsonb,
	"logo_file_url" text,
	"roster_file_url" text,
	"roster_file_name" varchar(255),
	"names" jsonb,
	"numbers" jsonb,
	"note" text,
	"discount_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"status" "order_status" NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"address" jsonb NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"pay_mode" "pay_mode" NOT NULL,
	"amount_paid" integer NOT NULL,
	"balance_paid" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"coupon" varchar(50),
	"gst" integer NOT NULL,
	"total" integer NOT NULL,
	"status" "order_status" DEFAULT 'Placed' NOT NULL,
	"status_index" integer DEFAULT 0 NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"method" "payment_method" NOT NULL,
	"mode" "pay_mode" NOT NULL,
	"amount" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"status" "payment_status" NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_design_options" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"product_id" varchar(100) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "review_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_customers" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"category" varchar(100),
	"sub_category" varchar(100),
	"product_id" varchar(100),
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"store_name" varchar(255) DEFAULT 'Jersey Fit' NOT NULL,
	"support_email" varchar(255) DEFAULT 'hello@jerseyfit.in' NOT NULL,
	"support_phone" varchar(50) DEFAULT '+91 98765 43210' NOT NULL,
	"gst_rate" numeric(4, 2) DEFAULT '5.00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" varchar(100),
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_categories_slug_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_customers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_customers" ADD CONSTRAINT "showcase_customers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;