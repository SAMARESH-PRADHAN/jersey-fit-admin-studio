import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CUSTOM_DESIGN_OPTIONS, DEFAULT_DISCOUNT_TIERS, SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/products";
import { KEYS, readStored, removeStored, writeStored } from "@/lib/storage";
import type { AdminSettings, CategoryRegistryItem, Coupon, CustomDesignOption, Customer, Order, OrderStatus, Payment, Product, ProductReview, ShowcaseCustomer } from "@/types";

const CUSTOMER_NAMES = ["Aarav Sharma", "Ananya Iyer", "Rohan Mehta", "Priya Nair", "Kabir Patel", "Ishita Rao", "Arjun Singh", "Meera Das", "Dev Malhotra", "Zoya Khan", "Aditya Bose", "Kavya Reddy", "Neil Fernandes", "Sana Kapoor", "Vivaan Joshi"];
const CITIES = ["Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Delhi", "Ahmedabad"];
const STATUSES: OrderStatus[] = ["Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
const METHODS: Order["paymentMethod"][] = ["UPI", "Card", "Net Banking", "COD"];

export const DEFAULT_SETTINGS: AdminSettings = {
  gstRate: 5,
  storeName: "Jersey Fit",
  supportEmail: "hello@jerseyfit.in",
  supportPhone: "+91 98765 43210",
  globalRules: {
    customisable: { moq: 5, discountTiers: DEFAULT_DISCOUNT_TIERS, printCharges: { logo: 40, name: 30, number: 30 }, printChargesByType: { "Sublimation Print": { logo: 40, name: 30, number: 30 }, "DTF Print": { logo: 40, name: 30, number: 30 } }, printTypes: ["Sublimation Print", "DTF Print"], addOnsAllowed: { logo: true, name: true, number: true }, rosterThreshold: 15 },
    readymade: { moq: 1, maxQty: 3 },
  },
  categoryRules: {},
  subcategoryRules: {},
};

export interface AdminData {
  products: Product[];
  categories: CategoryRegistryItem[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  coupons: Coupon[];
  settings: AdminSettings;
  showcase: ShowcaseCustomer[];
  customDesignOptions: CustomDesignOption[];
  reviews: ProductReview[];
  ready: boolean;
  setProducts: (data: Product[]) => void;
  setCategories: (data: CategoryRegistryItem[]) => void;
  setOrders: (data: Order[]) => void;
  setCustomers: (data: Customer[]) => void;
  setPayments: (data: Payment[]) => void;
  setCoupons: (data: Coupon[]) => void;
  setSettings: (data: AdminSettings) => void;
  setShowcase: (data: ShowcaseCustomer[]) => void;
  setCustomDesignOptions: (data: CustomDesignOption[]) => void;
  setReviews: (data: ProductReview[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  resetDemo: () => void;
  restoreBackup: (backup: unknown) => void;
}

function makeSeed(now: number) {
  const customers: Customer[] = CUSTOMER_NAMES.map((name, index) => ({
    id: `customer-${index + 1}`, name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.in`,
    phone: `+91 98${String(10000000 + index * 73117).slice(0, 8)}`,
    city: CITIES[index % CITIES.length] ?? "Mumbai",
    joinedAt: new Date(now - (index + 2) * 18 * 86400000).toISOString(), demo: true,
  }));
  const orders: Order[] = Array.from({ length: 45 }, (_, index) => {
    const customer = customers[index % customers.length] ?? customers[0];
    const product = SEED_PRODUCTS[(index * 3 + 2) % SEED_PRODUCTS.length] ?? SEED_PRODUCTS[0];
    if (!customer || !product) throw new Error("Demo records are unavailable");
    const customisable = product.family === "customisable";
    const quantity = customisable ? 5 + ((index * 7) % 28) : 1 + (index % 3);
    const subtotal = product.price * quantity;
    const discountPct = customisable ? (quantity >= 71 ? 40 : quantity >= 41 ? 30 : quantity >= 23 ? 20 : quantity >= 10 ? 10 : 0) : 0;
    const discount = Math.round(subtotal * discountPct / 100);
    const gst = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + gst;
    const statusIndex = index % STATUSES.length;
    const payMode = customisable && index % 4 === 0 ? "advance" : "full";
    const amountPaid = payMode === "advance" ? Math.round(total / 2) : total;
    const createdAt = new Date(now - (index * 4 + 1) * 86400000).toISOString();
    const status = STATUSES[statusIndex] ?? "Placed";
    return {
      id: `JF-${String(2401 + index)}`, userId: customer.id, customerName: customer.name,
      customerEmail: customer.email, customerPhone: customer.phone, createdAt, updatedAt: createdAt,
      items: [{ productId: product.id, productName: product.name, family: product.family, section: product.section, category: product.category, ...(product.subCategory ? { subCategory: product.subCategory } : {}), quantity, unitPrice: product.price, size: ["XS", "S", "M", "L", "XL", "2XL", "3XL"][index % 7] ?? "M", ...(customisable ? { printType: ["Sublimation Print", "DTF Print", "No Print"][index % 3] ?? "Sublimation Print", addOns: index % 3 === 0 ? ["Logo", "Name"] : ["Name", "Number"], ...(index % 9 === 0 ? { rosterFile: { name: "team-roster.csv", mime: "text/csv", dataUrl: "data:text/csv;base64,bmFtZSxzaXplCkFhcmF2LEw=" } } : {}) } : {}) }],
      address: { line: `${14 + index} Park Street`, city: customer.city, state: "India", pincode: `4000${index % 10}1` },
      paymentMethod: METHODS[index % METHODS.length] ?? "UPI", payMode, amountPaid, balancePaid: total - amountPaid,
      subtotal, discount, ...(index % 6 === 0 ? { coupon: ["JERSEY100", "FIT200", "SQUAD500"][index % 3] } : {}), gst, total,
      status, statusIndex, statusHistory: [{ status: "Placed", date: createdAt }, ...(statusIndex > 0 ? [{ status, date: createdAt }] : [])], demo: true,
    };
  });
  const payments: Payment[] = orders.flatMap((order) => [
    { id: `PAY-${order.id}`, orderId: order.id, customerName: order.customerName, method: order.paymentMethod, mode: order.payMode, amount: order.amountPaid, date: order.createdAt, status: "Collected" as const, demo: true },
    ...(order.balancePaid > 0 ? [{ id: `BAL-${order.id}`, orderId: order.id, customerName: order.customerName, method: order.paymentMethod, mode: order.payMode, amount: order.balancePaid, date: order.updatedAt, status: "Pending" as const, demo: true }] : []),
  ]);
  const coupons: Coupon[] = [
    { code: "JERSEY100", label: "₹100 off", amount: 100, discountType: "flat", minimumSubtotal: 0, active: true, startsAt: "2026-01-01", expiresAt: null, usageLimit: null, usageCount: 18 },
    { code: "FIT200", label: "₹200 off above ₹2,000", amount: 200, discountType: "flat", minimumSubtotal: 2000, active: true, startsAt: "2026-01-01", expiresAt: null, usageLimit: 100, usageCount: 9 },
    { code: "SQUAD500", label: "₹500 off above ₹6,000", amount: 500, discountType: "flat", minimumSubtotal: 6000, active: true, startsAt: "2026-01-01", expiresAt: null, usageLimit: 50, usageCount: 4 },
  ];
  const reviews: ProductReview[] = SEED_PRODUCTS.slice(0, 8).map((product, index) => {
    const rating = [5, 4, 5, 3, 5, 4, 2, 5][index] ?? 5;
    return { id: `review-${index + 1}`, productId: product.id, productName: product.name, customerName: CUSTOMER_NAMES[(index + 3) % CUSTOMER_NAMES.length] ?? "Jersey Fit customer", rating, text: ["Great fit and the print quality held up after washing.", "Comfortable material and a clean finish.", "The team loved the colours.", "Good jersey; delivery could be quicker.", "Sizing was accurate for our whole team.", "Lightweight and easy to move in.", "Print alignment needs a closer check.", "Excellent quality for match day."][index] ?? "Good product.", date: new Date(now - (index + 1) * 86400000).toISOString(), status: rating >= 4 ? "Positive" : rating === 3 ? "Neutral" : "Needs attention" };
  });
  return { products: SEED_PRODUCTS, categories: SEED_CATEGORIES, customers, orders, payments, coupons, settings: DEFAULT_SETTINGS, showcase: [] as ShowcaseCustomer[], customDesignOptions: CUSTOM_DESIGN_OPTIONS, reviews };
}

const AdminContext = createContext<AdminData | null>(null);
const KEYS_TO_DATA = [KEYS.products, KEYS.categories, KEYS.customers, KEYS.orders, KEYS.payments, KEYS.coupons, KEYS.settings, KEYS.showcase, KEYS.customDesignOptions, KEYS.reviews] as const;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState(SEED_PRODUCTS);
  const [categories, setCategoriesState] = useState(SEED_CATEGORIES);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [coupons, setCouponsState] = useState<Coupon[]>([]);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [showcase, setShowcaseState] = useState<ShowcaseCustomer[]>([]);
  const [customDesignOptions, setCustomDesignOptionsState] = useState(CUSTOM_DESIGN_OPTIONS);
  const [reviews, setReviewsState] = useState<ProductReview[]>([]);
  const [ready, setReady] = useState(false);

  const loadOrSeed = useCallback(() => {
    const seed = makeSeed(Date.now());
    const productData = readStored(KEYS.products, seed.products);
    const categoryData = readStored(KEYS.categories, seed.categories);
    const customerData = readStored(KEYS.customers, seed.customers);
    const orderData = readStored(KEYS.orders, seed.orders);
    const paymentData = readStored(KEYS.payments, seed.payments);
    const couponData = readStored(KEYS.coupons, seed.coupons);
    const settingsData = readStored(KEYS.settings, seed.settings);
    const showcaseData = readStored(KEYS.showcase, seed.showcase);
    const designData = readStored(KEYS.customDesignOptions, seed.customDesignOptions);
    const reviewData = readStored(KEYS.reviews, seed.reviews);
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem(KEYS.products) === null) {
        // SWAP POINT: replace with API call.
        for (const [key, value] of [[KEYS.products, productData], [KEYS.categories, categoryData], [KEYS.customers, customerData], [KEYS.orders, orderData], [KEYS.payments, paymentData], [KEYS.coupons, couponData], [KEYS.settings, settingsData], [KEYS.showcase, showcaseData], [KEYS.customDesignOptions, designData], [KEYS.reviews, reviewData]] as const) writeStored(key, value);
      }
    }
    const safeCategories = categoryData.length === 4 ? categoryData : seed.categories;
    const normalizedProducts = productData.filter((product) => product.section !== "Custom Your Design").map((product) => {
      const normalized = { ...product, overview: product.overview ?? "", washCare: product.washCare ?? "", designGuidelines: product.designGuidelines ?? "", active: product.active ?? true };
      if (normalized.section === "Custom Team Jersey" && normalized.category !== "custom-team-jersey") {
        return { ...normalized, category: "custom-team-jersey", subCategory: normalized.subCategory ?? product.category };
      }
      return normalized;
    });
    if (typeof window !== "undefined") {
      // SWAP POINT: replace with API call.
      writeStored(KEYS.products, normalizedProducts);
      writeStored(KEYS.categories, safeCategories);
      writeStored(KEYS.customDesignOptions, designData);
      writeStored(KEYS.reviews, reviewData);
    }
    setProductsState(normalizedProducts); setCategoriesState(safeCategories); setCustomersState(customerData);
    setOrdersState(orderData); setPaymentsState(paymentData); setCouponsState(couponData);
    setSettingsState({ ...DEFAULT_SETTINGS, ...settingsData }); setShowcaseState(showcaseData); setCustomDesignOptionsState(designData); setReviewsState(reviewData); setReady(true);
  }, []);

  useEffect(() => { loadOrSeed(); }, [loadOrSeed]);
  const update = useCallback(<T,>(key: string, set: (data: T) => void, data: T) => { set(data); writeStored(key, data); }, []);
  const setProducts = useCallback((data: Product[]) => update(KEYS.products, setProductsState, data), [update]);
  const setCategories = useCallback((data: CategoryRegistryItem[]) => update(KEYS.categories, setCategoriesState, data), [update]);
  const setCustomers = useCallback((data: Customer[]) => update(KEYS.customers, setCustomersState, data), [update]);
  const setOrders = useCallback((data: Order[]) => update(KEYS.orders, setOrdersState, data), [update]);
  const setPayments = useCallback((data: Payment[]) => update(KEYS.payments, setPaymentsState, data), [update]);
  const setCoupons = useCallback((data: Coupon[]) => update(KEYS.coupons, setCouponsState, data), [update]);
  const setSettings = useCallback((data: AdminSettings) => update(KEYS.settings, setSettingsState, data), [update]);
  const setShowcase = useCallback((data: ShowcaseCustomer[]) => update(KEYS.showcase, setShowcaseState, data), [update]);
  const setCustomDesignOptions = useCallback((data: CustomDesignOption[]) => update(KEYS.customDesignOptions, setCustomDesignOptionsState, data), [update]);
  const setReviews = useCallback((data: ProductReview[]) => update(KEYS.reviews, setReviewsState, data), [update]);
  const updateOrderStatus = useCallback((id: string, status: OrderStatus, note?: string) => {
    const now = new Date().toISOString();
    const next = orders.map((order) => order.id === id ? { ...order, status, statusIndex: STATUSES.indexOf(status), updatedAt: now, statusHistory: [...order.statusHistory, { status, date: now, ...(note ? { note } : {}) }] } : order);
    setOrders(next);
    const target = next.find((order) => order.id === id);
    if (target && target.balancePaid === 0) return;
  }, [orders, setOrders]);
  const resetDemo = useCallback(() => { for (const key of KEYS_TO_DATA) removeStored(key); loadOrSeed(); }, [loadOrSeed]);
  const restoreBackup = useCallback((backup: unknown) => {
    if (!backup || typeof backup !== "object") throw new Error("Backup file is not valid");
    const data = backup as Partial<Record<keyof typeof KEYS, unknown>>;
    if (Array.isArray(data.products)) setProducts(data.products as Product[]);
    if (Array.isArray(data.categories)) setCategories(data.categories as CategoryRegistryItem[]);
    if (Array.isArray(data.customers)) setCustomers(data.customers as Customer[]);
    if (Array.isArray(data.orders)) setOrders(data.orders as Order[]);
    if (Array.isArray(data.payments)) setPayments(data.payments as Payment[]);
    if (Array.isArray(data.coupons)) setCoupons(data.coupons as Coupon[]);
    if (data.settings && typeof data.settings === "object") setSettings(data.settings as AdminSettings);
    if (Array.isArray(data.showcase)) setShowcase(data.showcase as ShowcaseCustomer[]);
    if (Array.isArray(data.customDesignOptions)) setCustomDesignOptions(data.customDesignOptions as CustomDesignOption[]);
    if (Array.isArray(data.reviews)) setReviews(data.reviews as ProductReview[]);
  }, [setCategories, setCoupons, setCustomers, setOrders, setPayments, setProducts, setSettings, setShowcase, setCustomDesignOptions, setReviews]);

  const value = useMemo<AdminData>(() => ({ products, categories, customers, orders, payments, coupons, settings, showcase, customDesignOptions, reviews, ready, setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, setCustomDesignOptions, setReviews, updateOrderStatus, resetDemo, restoreBackup }), [products, categories, customers, orders, payments, coupons, settings, showcase, customDesignOptions, reviews, ready, setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, setCustomDesignOptions, setReviews, updateOrderStatus, resetDemo, restoreBackup]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminData {
  const context = useContext(AdminContext);
  if (!context) throw new Error("Admin data must be used within AdminProvider");
  return context;
}