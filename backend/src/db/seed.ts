import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { adminUsers } from "./schema/auth.js";
import { categories, subcategories, products, productImages } from "./schema/catalog.js";
import { customers } from "./schema/customers.js";
import { orders, orderItems, orderStatusHistory } from "./schema/orders.js";
import { payments } from "./schema/payments.js";
import { coupons, pricingRules } from "./schema/rules.js";
import {
  customDesignOptions,
  productReviews,
  storeSettings,
} from "./schema/settings.js";
import { DEFAULT_RULES, DEFAULT_DISCOUNT_TIERS } from "../services/rules.js";

const CUSTOMER_NAMES = [
  "Aarav Sharma", "Ananya Iyer", "Rohan Mehta", "Priya Nair", "Kabir Patel",
  "Ishita Rao", "Arjun Singh", "Meera Das", "Dev Malhotra", "Zoya Khan",
  "Aditya Bose", "Kavya Reddy", "Neil Fernandes", "Sana Kapoor", "Vivaan Joshi",
];
const CITIES = ["Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Delhi", "Ahmedabad"];
const STATUSES = ["Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"] as const;
const METHODS = ["UPI", "Card", "Net Banking", "COD"] as const;

export async function seedDatabase() {
  console.log("Seeding Jersey Fit database...");

  // 1. Initial Admin User
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@jerseyfit.in";
  const adminPass = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(adminPass, 10);

  await db
    .insert(adminUsers)
    .values({
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: process.env.INITIAL_ADMIN_NAME || "Store Administrator",
      role: "admin",
      active: true,
    })
    .onConflictDoNothing();

  // 2. Store Settings
  await db
    .insert(storeSettings)
    .values({
      id: 1,
      storeName: "Jersey Fit",
      supportEmail: "hello@jerseyfit.in",
      supportPhone: "+91 98765 43210",
      gstRate: "5.00",
    })
    .onConflictDoNothing();

  // 3. Custom Design Options
  const designOpts = [
    { id: "front-printed-jersey", name: "Front Printed Jersey", price: 599, description: "Your artwork printed on the front of the jersey." },
    { id: "front-back-printed-jersey", name: "Front & Back Printed Jersey", price: 749, description: "Custom artwork printed on both sides." },
    { id: "all-over-print-jersey", name: "All Over Print Jersey", price: 899, description: "Full-coverage custom jersey design." },
  ];
  for (const opt of designOpts) {
    await db.insert(customDesignOptions).values(opt).onConflictDoNothing();
  }

  // 4. Categories & Subcategories (Exactly 4 categories)
  const catEntries = [
    {
      slug: "custom-team-jersey",
      label: "Custom Team Jersey",
      family: "customisable" as const,
      type: "custom" as const,
      section: "Custom Team Jersey",
      description: "Custom jerseys for clubs, teams, and events.",
      image: "",
      subs: [
        { slug: "all-over-print", label: "All Over Printed Jersey" },
        { slug: "front-print", label: "Front Printed Jersey" },
        { slug: "back-print", label: "Back Printed Jersey" },
        { slug: "cricket", label: "Cricket Jersey" },
        { slug: "football", label: "Football Jersey" },
        { slug: "volleyball", label: "Volleyball Jersey" },
        { slug: "basketball", label: "Basketball Jersey" },
        { slug: "kabaddi", label: "Kabaddi Jersey" },
        { slug: "ganesh-puja", label: "Ganesh Puja Jersey" },
        { slug: "morning-walk", label: "Morning Walk Group" },
        { slug: "marathon", label: "Marathon" },
      ],
    },
    {
      slug: "custom-premium",
      label: "Custom Premium Collection",
      family: "customisable" as const,
      type: "premium" as const,
      section: "Custom Premium Collection",
      description: "Premium custom jerseys",
      image: "",
      subs: [],
    },
    {
      slug: "top-wear",
      label: "Sports Top Wear",
      family: "readymade" as const,
      type: "readymade" as const,
      section: "Sports Top Wear",
      description: "Ready-to-wear sports tops",
      image: "",
      subs: [
        { slug: "all-sports-top-wear", label: "All Sports Top Wear" },
        { slug: "round-neck", label: "Round Neck T-shirt" },
        { slug: "polo-neck", label: "Polo Neck T-shirt" },
      ],
    },
    {
      slug: "winter-top-wear",
      label: "Winter Sports Wear",
      family: "readymade" as const,
      type: "readymade" as const,
      section: "Winter Sports Wear",
      description: "Warm sportswear essentials",
      image: "",
      subs: [
        { slug: "all-winter-sports-wear", label: "All Winter Sports Wear" },
        { slug: "hoodie", label: "Premium Hoodies" },
        { slug: "sweatshirt", label: "Sweatshirt" },
        { slug: "oversized-tshirt", label: "Oversized T-shirts" },
      ],
    },
  ];

  for (const cat of catEntries) {
    await db
      .insert(categories)
      .values({
        slug: cat.slug,
        label: cat.label,
        family: cat.family,
        type: cat.type,
        section: cat.section,
        description: cat.description,
        image: cat.image,
      })
      .onConflictDoNothing();

    for (const sub of cat.subs) {
      await db
        .insert(subcategories)
        .values({
          categorySlug: cat.slug,
          slug: sub.slug,
          label: sub.label,
        })
        .onConflictDoNothing();
    }
  }

  // 5. Global Pricing Rules
  await db
    .insert(pricingRules)
    .values({
      scope: "global",
      family: "customisable",
      moq: 5,
      maxQty: null,
      discountTiers: DEFAULT_DISCOUNT_TIERS,
      printCharges: DEFAULT_RULES.customisable.printCharges,
      printChargesByType: DEFAULT_RULES.customisable.printChargesByType,
      printDescriptionsByType: DEFAULT_RULES.customisable.printDescriptionsByType,
      printTypes: DEFAULT_RULES.customisable.printTypes,
      addOnsAllowed: DEFAULT_RULES.customisable.addOnsAllowed,
      rosterThreshold: 15,
    })
    .onConflictDoNothing();

  await db
    .insert(pricingRules)
    .values({
      scope: "global",
      family: "readymade",
      moq: 1,
      maxQty: 3,
      discountTiers: [],
      printCharges: { logo: 0, name: 0, number: 0 },
      printChargesByType: {},
      printDescriptionsByType: {},
      printTypes: [],
      addOnsAllowed: { logo: false, name: false, number: false },
      rosterThreshold: 15,
    })
    .onConflictDoNothing();

  // 6. Products
  const seedRows: Array<[string, string, string, string | undefined, number, number, string]> = [
    ["JF-101", "Velocity Cricket Jersey", "Custom Team Jersey", "cricket", 699, 999, "Cricket"],
    ["JF-102", "Striker Football Kit", "Custom Team Jersey", "football", 749, 1099, "Football"],
    ["JF-103", "Court Pro Basketball Jersey", "Custom Team Jersey", "basketball", 699, 999, "Basketball"],
    ["JF-104", "Aero All-Over Jersey", "Custom Team Jersey", "all-over-print", 799, 1199, "All-over"],
    ["JF-105", "Classic Front Print Jersey", "Custom Team Jersey", "front-print", 599, 899, "Front print"],
    ["JF-106", "Premium Matchday Jersey", "Custom Premium Collection", "custom-premium", 999, 1499, "Premium"],
    ["JF-110", "Everyday Round Neck Top", "Sports Top Wear", "top-wear", 499, 799, "Round neck"],
    ["JF-111", "Club Polo Performance Top", "Sports Top Wear", "top-wear", 649, 999, "Polo neck"],
    ["JF-112", "Sideline Training Hoodie", "Winter Sports Wear", "winter-top-wear", 1199, 1799, "Hoodie"],
    ["JF-113", "Warmup Crew Sweatshirt", "Winter Sports Wear", "winter-top-wear", 999, 1499, "Sweatshirt"],
    ["JF-114", "Oversized Fan Tee", "Winter Sports Wear", "winter-top-wear", 799, 1199, "Oversized"],
  ];

  const seededProducts = seedRows.map((row, index) => {
    const section = row[2];
    const family = section === "Sports Top Wear" || section === "Winter Sports Wear" ? "readymade" as const : "customisable" as const;
    const category = section === "Custom Team Jersey" ? "custom-team-jersey" : section === "Custom Premium Collection" ? "custom-premium" : row[3]!;
    const subCategory = section === "Sports Top Wear" ? (row[0] === "JF-111" ? "polo-neck" : "round-neck")
      : section === "Winter Sports Wear" ? (row[0] === "JF-112" ? "hoodie" : row[0] === "JF-113" ? "sweatshirt" : "oversized-tshirt")
      : section === "Custom Team Jersey" ? row[3]
      : undefined;

    return {
      id: `product-${index + 1}`,
      code: row[0],
      name: row[1],
      section,
      family,
      category,
      subCategory,
      price: row[4],
      mrp: row[5],
      material: "Dry-fit polyester",
      description: `${row[1]} — made for your team, made to move.`,
      overview: "Lightweight performance fabric designed for comfortable movement.",
      washCare: "Machine wash cold with similar colours. Do not bleach. Iron on low heat; avoid printed areas.",
      designGuidelines: "Supply artwork at 300 DPI with clear margins around all print-safe areas.",
      rating: String(4.6 + (index % 4) * 0.1),
      tag: row[6],
      isExclusiveTopWear: family === "readymade",
      active: true,
      demo: true,
    };
  });

  for (const prod of seededProducts) {
    await db.insert(products).values(prod).onConflictDoNothing();
  }

  // 7. Coupons
  const cpnList = [
    { code: "JERSEY100", label: "Save ₹100", amount: 100, discountType: "flat" as const, minimumSubtotal: 0, active: true, startsAt: new Date("2026-01-01"), expiresAt: new Date("2027-12-31"), usageLimit: null, usageCount: 18 },
    { code: "FIT200", label: "₹200 off above ₹2,000", amount: 200, discountType: "flat" as const, minimumSubtotal: 2000, active: true, startsAt: new Date("2026-01-01"), expiresAt: new Date("2027-12-31"), usageLimit: 100, usageCount: 9 },
    { code: "SQUAD500", label: "₹500 off above ₹6,000", amount: 500, discountType: "flat" as const, minimumSubtotal: 6000, active: true, startsAt: new Date("2026-01-01"), expiresAt: new Date("2027-12-31"), usageLimit: 50, usageCount: 4 },
  ];
  for (const cpn of cpnList) {
    await db.insert(coupons).values(cpn).onConflictDoNothing();
  }

  // 8. Customers & Orders Seed
  const now = Date.now();
  const customerList = CUSTOMER_NAMES.map((name, index) => ({
    id: `customer-${index + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.in`,
    phone: `+91 98${String(10000000 + index * 73117).slice(0, 8)}`,
    city: CITIES[index % CITIES.length] ?? "Mumbai",
    joinedAt: new Date(now - (index + 2) * 18 * 86400000),
    demo: true,
  }));

  for (const c of customerList) {
    await db.insert(customers).values(c).onConflictDoNothing();
  }

  for (let index = 0; index < 45; index++) {
    const customer = customerList[index % customerList.length]!;
    const product = seededProducts[(index * 3 + 2) % seededProducts.length]!;
    const customisable = product.family === "customisable";
    const quantity = customisable ? 5 + ((index * 7) % 28) : 1 + (index % 3);
    const subtotal = product.price * quantity;
    const discountPct = customisable ? (quantity >= 71 ? 40 : quantity >= 41 ? 30 : quantity >= 23 ? 20 : quantity >= 10 ? 10 : 0) : 0;
    const discount = Math.round((subtotal * discountPct) / 100);
    const gst = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + gst;
    const statusIndex = index % STATUSES.length;
    const status = STATUSES[statusIndex]!;
    const payMode = customisable && index % 4 === 0 ? ("advance" as const) : ("full" as const);
    const amountPaid = payMode === "advance" ? Math.round(total / 2) : total;
    const balancePaid = total - amountPaid;
    const createdAt = new Date(now - (index * 4 + 1) * 86400000);
    const orderId = `JF-${2401 + index}`;

    await db
      .insert(orders)
      .values({
        id: orderId,
        userId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        createdAt,
        updatedAt: createdAt,
        address: { line: `${14 + index} Park Street`, city: customer.city, state: "India", pincode: `4000${index % 10}1` },
        paymentMethod: METHODS[index % METHODS.length]!,
        payMode,
        amountPaid,
        balancePaid,
        subtotal,
        discount,
        coupon: index % 6 === 0 ? ["JERSEY100", "FIT200", "SQUAD500"][index % 3] : undefined,
        gst,
        total,
        status,
        statusIndex,
        demo: true,
      })
      .onConflictDoNothing();

    await db
      .insert(orderItems)
      .values({
        orderId,
        productId: product.id,
        productName: product.name,
        family: product.family,
        section: product.section,
        category: product.category,
        subCategory: product.subCategory,
        quantity,
        unitPrice: product.price,
        size: ["XS", "S", "M", "L", "XL", "2XL", "3XL"][index % 7] ?? "M",
        printType: customisable ? ["Sublimation Print", "DTF Print", "No Print"][index % 3] : undefined,
        addOns: customisable ? (index % 3 === 0 ? ["Logo", "Name"] : ["Name", "Number"]) : undefined,
        discountPct: String(discountPct),
      })
      .onConflictDoNothing();

    await db
      .insert(orderStatusHistory)
      .values({
        orderId,
        status: "Placed",
        date: createdAt,
      })
      .onConflictDoNothing();

    if (statusIndex > 0) {
      await db
        .insert(orderStatusHistory)
        .values({
          orderId,
          status,
          date: createdAt,
        })
        .onConflictDoNothing();
    }

    await db
      .insert(payments)
      .values({
        id: `PAY-${orderId}`,
        orderId,
        customerName: customer.name,
        method: METHODS[index % METHODS.length]!,
        mode: payMode,
        amount: amountPaid,
        date: createdAt,
        status: "Collected",
        demo: true,
      })
      .onConflictDoNothing();

    if (balancePaid > 0) {
      await db
        .insert(payments)
        .values({
          id: `BAL-${orderId}`,
          orderId,
          customerName: customer.name,
          method: METHODS[index % METHODS.length]!,
          mode: payMode,
          amount: balancePaid,
          date: createdAt,
          status: "Pending",
          demo: true,
        })
        .onConflictDoNothing();
    }
  }

  // 9. Product Reviews Seed
  for (let index = 0; index < seededProducts.slice(0, 8).length; index++) {
    const prod = seededProducts[index]!;
    const rating = [5, 4, 5, 3, 5, 4, 2, 5][index] ?? 5;
    await db
      .insert(productReviews)
      .values({
        id: `review-${index + 1}`,
        productId: prod.id,
        productName: prod.name,
        customerName: CUSTOMER_NAMES[(index + 3) % CUSTOMER_NAMES.length] ?? "Jersey Fit customer",
        rating,
        text: [
          "Great fit and the print quality held up after washing.",
          "Comfortable material and a clean finish.",
          "The team loved the colours.",
          "Good jersey; delivery could be quicker.",
          "Sizing was accurate for our whole team.",
          "Lightweight and easy to move in.",
          "Print alignment needs a closer check.",
          "Excellent quality for match day.",
        ][index] ?? "Good product.",
        date: new Date(now - (index + 1) * 86400000),
        status: rating >= 4 ? "Positive" : rating === 3 ? "Neutral" : "Needs attention",
      })
      .onConflictDoNothing();
  }

  console.log("Seeding complete!");
}

if (process.argv[1]?.includes("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
