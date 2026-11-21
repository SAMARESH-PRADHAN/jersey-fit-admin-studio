export type ProductFamily = "customisable" | "readymade";
export type ProductSection =
  | "Custom Team Jersey"
  | "Custom Premium Collection"
  | "Custom Your Design"
  | "Sports Top Wear"
  | "Winter Sports Wear";

export interface Product {
  id: string;
  code: string;
  name: string;
  family: ProductFamily;
  section: ProductSection;
  category: string;
  subCategory?: string;
  price: number;
  mrp: number;
  material: string;
  description: string;
  overview: string;
  washCare: string;
  designGuidelines: string;
  images: string[];
  rating: number;
  tag?: string;
  isExclusiveTopWear: boolean;
  active: boolean;
  demo?: boolean;
}

export interface CategoryRegistryItem {
  slug: string;
  label: string;
  image: string;
  description: string;
  family: ProductFamily;
  type: "custom" | "premium" | "readymade" | "custom-tshirt";
  section: ProductSection;
  subcategories: Array<{ slug: string; label: string; description?: string; image?: string }>;
}

export interface DiscountTier {
  min: number;
  max: number | null;
  pct: number;
}

export interface PricingConfig {
  family: ProductFamily;
  moq: number;
  maxQty: number | null;
  discountTiers: DiscountTier[];
  printCharges: { logo: number; name: number; number: number };
  printChargesByType?: Partial<Record<"Sublimation Print" | "DTF Print", { logo: number; name: number; number: number }>>;
  printDescriptionsByType?: Partial<Record<"Sublimation Print" | "DTF Print", { logo: string; name: string; number: string }>>;
  printTypes: string[];
  addOnsAllowed: { logo: boolean; name: boolean; number: boolean };
  rosterThreshold: number;
}

export interface RuleOverrides {
  moq?: number;
  maxQty?: number | null;
  discountTiers?: DiscountTier[];
  printCharges?: PricingConfig["printCharges"];
  printChargesByType?: PricingConfig["printChargesByType"];
  printDescriptionsByType?: PricingConfig["printDescriptionsByType"];
  printTypes?: string[];
  addOnsAllowed?: PricingConfig["addOnsAllowed"];
  rosterThreshold?: number;
}

export interface Coupon {
  code: string;
  label: string;
  amount: number;
  discountType: "flat" | "percentage";
  minimumSubtotal: number;
  active: boolean;
  startsAt: string;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
}

export interface CustomDesignOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  text: string;
  date: string;
  status: "Positive" | "Neutral" | "Needs attention";
}

export type OrderStatus = "Placed" | "Packed" | "Shipped" | "Out for Delivery" | "Delivered";

export interface OrderItem {
  productId: string;
  productName: string;
  family: ProductFamily;
  section: ProductSection;
  category: string;
  subCategory?: string;
  quantity: number;
  unitPrice: number;
  size: string;
  printType?: string;
  addOns?: string[];
  logoDataUrl?: string;
  rosterFile?: { name: string; mime: string; dataUrl: string };
  names?: string[];
  numbers?: string[];
  note?: string;
  discountPct?: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: { line: string; city: string; state: string; pincode: string; company?: string; gstin?: string };
  paymentMethod: "UPI" | "Card" | "Net Banking" | "COD";
  payMode: "full" | "advance";
  amountPaid: number;
  balancePaid: number;
  subtotal: number;
  discount: number;
  coupon?: string;
  gst: number;
  total: number;
  status: OrderStatus;
  statusIndex: number;
  statusHistory: Array<{ status: OrderStatus; date: string; note?: string }>;
  demo: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: string;
  demo: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  method: Order["paymentMethod"];
  mode: Order["payMode"];
  amount: number;
  date: string;
  status: "Collected" | "Pending";
  demo: boolean;
}

export interface ShowcaseCustomer {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  category?: string;
  subCategory?: string;
  productId?: string;
  demo?: boolean;
}

export interface AdminSettings {
  gstRate: number;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  globalRules: Record<ProductFamily, RuleOverrides>;
  categoryRules: Record<string, RuleOverrides>;
  subcategoryRules: Record<string, RuleOverrides>;
}