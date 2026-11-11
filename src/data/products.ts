import type { CategoryRegistryItem, DiscountTier, Product } from "@/types";

export const DEFAULT_DISCOUNT_TIERS: DiscountTier[] = [
  { min: 10, max: 22, pct: 10 },
  { min: 23, max: 40, pct: 20 },
  { min: 41, max: 70, pct: 30 },
  { min: 71, max: null, pct: 40 },
];

const customTeamCategories = [
  "all-over-print",
  "front-print",
  "back-print",
  "cricket",
  "football",
  "volleyball",
  "basketball",
  "kabaddi",
  "ganesh-puja",
  "morning-walk",
  "marathon",
];

export const SEED_CATEGORIES: CategoryRegistryItem[] = [
  ...customTeamCategories.map((slug) => ({
    slug,
    label: slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "),
    image: "",
    description: "Custom team jersey",
    family: "customisable" as const,
    type: "custom" as const,
    section: "Custom Team Jersey" as const,
    subcategories: [],
  })),
  {
    slug: "custom-premium",
    label: "Custom Premium Collection",
    image: "",
    description: "Premium custom jerseys",
    family: "customisable",
    type: "premium",
    section: "Custom Premium Collection",
    subcategories: [],
  },
  {
    slug: "custom-tshirt-design",
    label: "Custom Your Design",
    image: "",
    description: "Upload your own design",
    family: "customisable",
    type: "custom-tshirt",
    section: "Custom Your Design",
    subcategories: [
      { slug: "front-printed-jersey", label: "Front Printed Jersey" },
      { slug: "front-back-printed-jersey", label: "Front & Back Printed Jersey" },
      { slug: "all-over-print-jersey", label: "All Over Print Jersey" },
    ],
  },
  {
    slug: "top-wear",
    label: "Sports Top Wear",
    image: "",
    description: "Ready-to-wear sports tops",
    family: "readymade",
    type: "readymade",
    section: "Sports Top Wear",
    subcategories: [
      { slug: "round-neck", label: "Round Neck" },
      { slug: "polo-neck", label: "Polo Neck" },
    ],
  },
  {
    slug: "winter-top-wear",
    label: "Winter Sports Wear",
    image: "",
    description: "Warm sportswear essentials",
    family: "readymade",
    type: "readymade",
    section: "Winter Sports Wear",
    subcategories: [
      { slug: "hoodie", label: "Hoodie" },
      { slug: "sweatshirt", label: "Sweatshirt" },
      { slug: "oversized-tshirt", label: "Oversized T-shirt" },
    ],
  },
];

const seedRows: Array<[string, string, string, string | undefined, number, number, string]> = [
  ["JF-101", "Velocity Cricket Jersey", "Custom Team Jersey", "cricket", 699, 999, "Cricket"],
  ["JF-102", "Striker Football Kit", "Custom Team Jersey", "football", 749, 1099, "Football"],
  ["JF-103", "Court Pro Basketball Jersey", "Custom Team Jersey", "basketball", 699, 999, "Basketball"],
  ["JF-104", "Aero All-Over Jersey", "Custom Team Jersey", "all-over-print", 799, 1199, "All-over"],
  ["JF-105", "Classic Front Print Jersey", "Custom Team Jersey", "front-print", 599, 899, "Front print"],
  ["JF-106", "Premium Matchday Jersey", "Custom Premium Collection", "custom-premium", 999, 1499, "Premium"],
  ["JF-107", "Your Design — Front Print", "Custom Your Design", "custom-tshirt-design", 599, 899, "Custom design"],
  ["JF-108", "Your Design — Two Sided", "Custom Your Design", "custom-tshirt-design", 749, 1099, "Custom design"],
  ["JF-109", "Your Design — All Over", "Custom Your Design", "custom-tshirt-design", 899, 1299, "Custom design"],
  ["JF-110", "Everyday Round Neck Top", "Sports Top Wear", "top-wear", 499, 799, "Round neck"],
  ["JF-111", "Club Polo Performance Top", "Sports Top Wear", "top-wear", 649, 999, "Polo neck"],
  ["JF-112", "Sideline Training Hoodie", "Winter Sports Wear", "winter-top-wear", 1199, 1799, "Hoodie"],
  ["JF-113", "Warmup Crew Sweatshirt", "Winter Sports Wear", "winter-top-wear", 999, 1499, "Sweatshirt"],
  ["JF-114", "Oversized Fan Tee", "Winter Sports Wear", "winter-top-wear", 799, 1199, "Oversized"],
];

export const SEED_PRODUCTS: Product[] = seedRows.map((row, index) => {
  const section = row[2] as Product["section"];
  const family = section === "Sports Top Wear" || section === "Winter Sports Wear" ? "readymade" : "customisable";
  const category = row[3] ?? "custom-premium";
  const subCategory = section === "Sports Top Wear" ? (index === 10 ? "polo-neck" : "round-neck")
    : section === "Winter Sports Wear" ? ["hoodie", "sweatshirt", "oversized-tshirt"][index - 11]
    : section === "Custom Your Design" ? ["front-printed-jersey", "front-back-printed-jersey", "all-over-print-jersey"][index - 6]
    : undefined;
  return {
    id: `product-${index + 1}`,
    code: row[0],
    name: row[1],
    section,
    family,
    category,
    ...(subCategory ? { subCategory } : {}),
    price: row[4],
    mrp: row[5],
    material: "Dry-fit polyester",
    description: `${row[1]} — made for your team, made to move.`,
    images: [],
    rating: 4.6 + (index % 4) * 0.1,
    tag: row[6],
    isExclusiveTopWear: family === "readymade",
    demo: true,
  };
});