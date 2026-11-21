import { z } from "zod";

// --- Product & Catalog ---
export const productFamilySchema = z.enum(["customisable", "readymade"]);
export const productSectionSchema = z.enum([
  "Custom Team Jersey",
  "Custom Premium Collection",
  "Custom Your Design",
  "Sports Top Wear",
  "Winter Sports Wear",
]);

export const discountTierSchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().min(1).nullable(),
  pct: z.number().min(0).max(100),
});

export const printChargesSchema = z.object({
  logo: z.number().min(0),
  name: z.number().min(0),
  number: z.number().min(0),
});

export const ruleOverridesSchema = z.object({
  moq: z.number().int().min(1).optional(),
  maxQty: z.number().int().min(1).nullable().optional(),
  discountTiers: z.array(discountTierSchema).optional(),
  printCharges: printChargesSchema.optional(),
  printChargesByType: z.record(printChargesSchema).optional(),
  printDescriptionsByType: z
    .record(
      z.object({
        logo: z.string(),
        name: z.string(),
        number: z.string(),
      }),
    )
    .optional(),
  printTypes: z.array(z.string()).optional(),
  addOnsAllowed: z
    .object({
      logo: z.boolean(),
      name: z.boolean(),
      number: z.boolean(),
    })
    .optional(),
  rosterThreshold: z.number().int().min(1).optional(),
});

export const productCreateInputSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().min(1, "Product code is required").transform((v) => v.trim().toUpperCase()),
    name: z.string().min(1, "Product name is required"),
    family: productFamilySchema,
    section: productSectionSchema,
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().optional(),
    price: z.number().int().min(0),
    mrp: z.number().int().min(0),
    material: z.string().default("Dry-fit polyester"),
    description: z.string().default(""),
    overview: z.string().default(""),
    washCare: z.string().default(""),
    designGuidelines: z.string().default(""),
    images: z.array(z.string()).max(4, "Max 4 images allowed").default([]),
    rating: z.number().min(0).max(5).default(4.5),
    tag: z.string().optional(),
    isExclusiveTopWear: z.boolean().default(false),
    active: z.boolean().default(true),
    demo: z.boolean().default(false),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be greater than or equal to selling price",
    path: ["mrp"],
  });

export const categoryCreateInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .transform((v) => v.toLowerCase().replace(/\s+/g, "-")),
  label: z.string().min(1),
  image: z.string().default(""),
  description: z.string().default(""),
  family: productFamilySchema,
  type: z.enum(["custom", "premium", "readymade", "custom-tshirt"]),
  section: productSectionSchema,
  subcategories: z
    .array(
      z.object({
        slug: z
          .string()
          .min(1)
          .transform((v) => v.toLowerCase().replace(/\s+/g, "-")),
        label: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .default([]),
});

// --- Coupons ---
export const couponInputSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((v) => v.trim().toUpperCase()),
  label: z.string().min(1),
  amount: z.number().int().min(1),
  discountType: z.enum(["flat", "percentage"]),
  minimumSubtotal: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  startsAt: z.string(),
  expiresAt: z.string().nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
});

// --- Orders & Cart Pricing ---
export const cartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  size: z.string().min(1),
  printType: z.string().optional(),
  addOns: z.array(z.string()).optional(),
  names: z.array(z.string()).optional(),
  numbers: z.array(z.string()).optional(),
  note: z.string().optional(),
  logoFileUrl: z.string().optional(),
  rosterFileUrl: z.string().optional(),
  rosterFileName: z.string().optional(),
});

export const addressSchema = z.object({
  line: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().default("India"),
  pincode: z.string().min(4, "Pincode is required"),
  company: z.string().optional(),
  gstin: z.string().optional(),
});

export const createOrderInputSchema = z.object({
  cart: z.array(cartItemInputSchema).min(1, "Cart cannot be empty"),
  customer: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().min(7, "Valid phone number required"),
    city: z.string().min(1, "City is required"),
  }),
  address: addressSchema,
  paymentMethod: z.enum(["UPI", "Card", "Net Banking", "COD"]),
  payMode: z.enum(["full", "advance"]),
  couponCode: z.string().optional(),
});

// --- Auth ---
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
