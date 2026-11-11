import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_DISCOUNT_TIERS, SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/products";
import { KEYS, readStored, removeStored, writeStored } from "@/lib/storage";
import type { AdminSettings, CategoryRegistryItem, Coupon, Customer, Order, OrderStatus, Payment, Product, ShowcaseCustomer } from "@/types";

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
    customisable: { moq: 5, discountTiers: DEFAULT_DISCOUNT_TIERS, printCharges: { logo: 40, name: 30, number: 30 }, printTypes: ["Sublimation Print", "DTF Print", "No Print"], addOnsAllowed: { logo: true, name: true, number: true }, rosterThreshold: 15 },
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
  ready: boolean;
  setProducts: (data: Product[]) => void;
  setCategories: (data: CategoryRegistryItem[]) => void;
  setOrders: (data: Order[]) => void;
  setCustomers: (data: Customer[]) => void;
  setPayments: (data: Payment[]) => void;
  setCoupons: (data: Coupon[]) => void;
  setSettings: (data: AdminSettings) => void;
  setShowcase: (data: ShowcaseCustomer[]) => void;
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
    { code: "JERSEY100", label: "₹100 off", amount: 100, minimumSubtotal: 0, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: null, usageCount: 18 },
    { code: "FIT200", label: "₹200 off above ₹2,000", amount: 200, minimumSubtotal: 2000, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: 100, usageCount: 9 },
    { code: "SQUAD500", label: "₹500 off above ₹6,000", amount: 500, minimumSubtotal: 6000, active: true, startsAt: "2026-01-01", expiresAt: "2027-12-31", usageLimit: 50, usageCount: 4 },
  ];
  return { products: SEED_PRODUCTS, categories: SEED_CATEGORIES, customers, orders, payments, coupons, settings: DEFAULT_SETTINGS, showcase: [] as ShowcaseCustomer[] };
}

const AdminContext = createContext<AdminData | null>(null);
const KEYS_TO_DATA = [KEYS.products, KEYS.categories, KEYS.customers, KEYS.orders, KEYS.payments, KEYS.coupons, KEYS.settings, KEYS.showcase] as const;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState(SEED_PRODUCTS);
  const [categories, setCategoriesState] = useState(SEED_CATEGORIES);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [coupons, setCouponsState] = useState<Coupon[]>([]);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [showcase, setShowcaseState] = useState<ShowcaseCustomer[]>([]);
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
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem(KEYS.products) === null) {
        // SWAP POINT: replace with API call.
        for (const [key, value] of [[KEYS.products, productData], [KEYS.categories, categoryData], [KEYS.customers, customerData], [KEYS.orders, orderData], [KEYS.payments, paymentData], [KEYS.coupons, couponData], [KEYS.settings, settingsData], [KEYS.showcase, showcaseData]] as const) writeStored(key, value);
      }
    }
    setProductsState(productData); setCategoriesState(categoryData); setCustomersState(customerData);
    setOrdersState(orderData); setPaymentsState(paymentData); setCouponsState(couponData);
    setSettingsState({ ...DEFAULT_SETTINGS, ...settingsData }); setShowcaseState(showcaseData); setReady(true);
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
  }, [setCategories, setCoupons, setCustomers, setOrders, setPayments, setProducts, setSettings, setShowcase]);

  const value = useMemo<AdminData>(() => ({ products, categories, customers, orders, payments, coupons, settings, showcase, ready, setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, updateOrderStatus, resetDemo, restoreBackup }), [products, categories, customers, orders, payments, coupons, settings, showcase, ready, setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, updateOrderStatus, resetDemo, restoreBackup]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminData {
  const context = useContext(AdminContext);
  if (!context) throw new Error("Admin data must be used within AdminProvider");
  return context;
}