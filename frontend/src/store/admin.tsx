import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CUSTOM_DESIGN_OPTIONS, DEFAULT_DISCOUNT_TIERS, SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/products";
import { KEYS, readStored, removeStored, writeStored } from "@/lib/storage";
import { callBackendApi } from "@/lib/api-client";
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
  const orders: Order[] = [];
  const payments: Payment[] = [];
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
  const [products, setProductsState] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategoriesState] = useState<CategoryRegistryItem[]>(SEED_CATEGORIES);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [coupons, setCouponsState] = useState<Coupon[]>([]);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [showcase, setShowcaseState] = useState<ShowcaseCustomer[]>([]);
  const [customDesignOptions, setCustomDesignOptionsState] = useState(CUSTOM_DESIGN_OPTIONS);
  const [reviews, setReviewsState] = useState<ProductReview[]>([]);
  const [ready, setReady] = useState(false);

  const loadOrSeed = useCallback(async () => {
    const seed = makeSeed(Date.now());
    let productData = readStored(KEYS.products, seed.products);
    let categoryData = readStored(KEYS.categories, seed.categories);
    let customerData = readStored(KEYS.customers, seed.customers);
    let orderData = readStored(KEYS.orders, seed.orders).filter((o: any) => !o.demo);
    let paymentData = readStored(KEYS.payments, seed.payments).filter((p: any) => !p.demo);
    let couponData = readStored(KEYS.coupons, seed.coupons);
    let settingsData = readStored(KEYS.settings, seed.settings);
    let showcaseData = readStored(KEYS.showcase, seed.showcase);
    let designData = readStored(KEYS.customDesignOptions, seed.customDesignOptions);
    let reviewData = readStored(KEYS.reviews, seed.reviews);

    // Try live Neon Backend first (only if logged in with session token)
    try {
      const sessionStr = typeof window !== "undefined" ? window.localStorage.getItem(KEYS.session) : null;
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const token = session?.token;

      // Always load public storefront data
      const [remoteCats, remoteProds, remoteDesign, remoteReviews] = await Promise.allSettled([
        callBackendApi<CategoryRegistryItem[]>("storefront.listCategories"),
        callBackendApi<{ products: Product[] } | Product[]>("storefront.listProducts", { pageSize: 100 }),
        callBackendApi<CustomDesignOption[]>("storefront.listCustomDesignOptions"),
        callBackendApi<ProductReview[]>("storefront.listProductReviews"),
      ]);

      if (remoteCats.status === "fulfilled" && Array.isArray(remoteCats.value) && remoteCats.value.length > 0) {
        categoryData = remoteCats.value;
      }
      if (remoteProds.status === "fulfilled" && remoteProds.value) {
        const prodList = Array.isArray(remoteProds.value) ? remoteProds.value : (remoteProds.value as any).products;
        if (Array.isArray(prodList) && prodList.length > 0) {
          productData = prodList;
        }
      }
      if (remoteDesign.status === "fulfilled" && Array.isArray(remoteDesign.value) && remoteDesign.value.length > 0) {
        designData = remoteDesign.value;
      }
      if (remoteReviews.status === "fulfilled" && Array.isArray(remoteReviews.value) && remoteReviews.value.length > 0) {
        reviewData = remoteReviews.value;
      }

      // Load authenticated admin data if session token exists
      if (token) {
        const [remoteCusts, remoteOrders, remotePayments, remoteCoupons, remoteSettings] = await Promise.allSettled([
          callBackendApi<Customer[]>("admin.customers.list", undefined, token),
          callBackendApi<Order[]>("admin.orders.list", undefined, token),
          callBackendApi<Payment[]>("admin.payments.list", undefined, token),
          callBackendApi<Coupon[]>("admin.coupons.list", undefined, token),
          callBackendApi<AdminSettings>("admin.settings.get", undefined, token),
        ]);

        if (remoteCusts.status === "fulfilled" && Array.isArray(remoteCusts.value) && remoteCusts.value.length > 0) {
          customerData = remoteCusts.value;
        }
        if (remoteOrders.status === "fulfilled" && remoteOrders.value) {
          const list = Array.isArray(remoteOrders.value)
            ? remoteOrders.value
            : Array.isArray((remoteOrders.value as any).orders)
            ? (remoteOrders.value as any).orders
            : null;
          if (list !== null) {
            orderData = list;
          }
        }
        if (remotePayments.status === "fulfilled" && Array.isArray(remotePayments.value) && remotePayments.value.length > 0) {
          paymentData = remotePayments.value;
        }
        if (remoteCoupons.status === "fulfilled" && Array.isArray(remoteCoupons.value) && remoteCoupons.value.length > 0) {
          couponData = remoteCoupons.value;
        }
        if (remoteSettings.status === "fulfilled" && remoteSettings.value) {
          settingsData = remoteSettings.value;
        }
      }
    } catch {
      // Backend not running, continues with local storage fallback
    }

    const safeCategories = categoryData.length > 0 ? categoryData : seed.categories;
    const normalizedProducts = productData.filter((product) => product.section !== "Custom Your Design").map((product) => {
      const normalized = { ...product, overview: product.overview ?? "", washCare: product.washCare ?? "", designGuidelines: product.designGuidelines ?? "", active: product.active ?? true };
      if (normalized.section === "Custom Team Jersey" && normalized.category !== "custom-team-jersey") {
        return { ...normalized, category: "custom-team-jersey", subCategory: normalized.subCategory ?? product.category };
      }
      return normalized;
    });

    if (typeof window !== "undefined") {
      writeStored(KEYS.products, normalizedProducts);
      writeStored(KEYS.categories, safeCategories);
      writeStored(KEYS.customers, customerData);
      writeStored(KEYS.orders, orderData);
      writeStored(KEYS.payments, paymentData);
      writeStored(KEYS.coupons, couponData);
      writeStored(KEYS.settings, settingsData);
      writeStored(KEYS.customDesignOptions, designData);
      writeStored(KEYS.reviews, reviewData);
    }

    setProductsState(normalizedProducts);
    setCategoriesState(safeCategories);
    setCustomersState(customerData);
    setOrdersState(orderData);
    setPaymentsState(paymentData);
    setCouponsState(couponData);
    setSettingsState({ ...DEFAULT_SETTINGS, ...settingsData });
    setShowcaseState(showcaseData);
    setCustomDesignOptionsState(designData);
    setReviewsState(reviewData);
    setReady(true);
  }, []);

  useEffect(() => { void loadOrSeed(); }, [loadOrSeed]);

  const update = useCallback(<T,>(key: string, set: (data: T) => void, data: T) => {
    set(data);
    writeStored(key, data);
  }, []);

  // Sync Products (Create / Update / Delete) to Database
  const setProducts = useCallback((data: Product[]) => {
    setProductsState((current) => {
      // 1. Check for deletions
      const currentIds = new Set(data.map((p) => p.id));
      const deleted = current.filter((p) => !currentIds.has(p.id));
      if (deleted.length > 0) {
        if (deleted.length === 1 && deleted[0]) {
          void callBackendApi("admin.products.delete", { id: deleted[0].id }).catch(() => {});
        } else {
          void callBackendApi("admin.products.bulkDelete", { ids: deleted.map((d) => d.id) }).catch(() => {});
        }
      }

      // 2. Check for creates or updates
      const oldMap = new Map(current.map((p) => [p.id, p]));
      for (const item of data) {
        const existing = oldMap.get(item.id);
        if (!existing) {
          // Newly created product
          void callBackendApi("admin.products.create", item).catch(() => {});
        } else if (JSON.stringify(existing) !== JSON.stringify(item)) {
          // Updated product
          void callBackendApi("admin.products.update", { id: item.id, data: item }).catch(() => {});
        }
      }

      writeStored(KEYS.products, data);
      return data;
    });
  }, []);

  // Sync Categories (Create / Update / Delete) to Database
  const setCategories = useCallback((data: CategoryRegistryItem[]) => {
    setCategoriesState((current) => {
      // Check deleted
      const currentSlugs = new Set(data.map((c) => c.slug));
      const deleted = current.filter((c) => !currentSlugs.has(c.slug));
      for (const d of deleted) {
        void callBackendApi("admin.categories.delete", { slug: d.slug }).catch(() => {});
      }

      // Check create / update
      const oldMap = new Map(current.map((c) => [c.slug, c]));
      for (const item of data) {
        const existing = oldMap.get(item.slug);
        if (!existing) {
          void callBackendApi("admin.categories.create", item).catch(() => {});
        } else if (JSON.stringify(existing) !== JSON.stringify(item)) {
          void callBackendApi("admin.categories.update", { slug: item.slug, data: item }).catch(() => {});
        }
      }

      writeStored(KEYS.categories, data);
      return data;
    });
  }, []);

  const setCustomers = useCallback((data: Customer[]) => {
    update(KEYS.customers, setCustomersState, data);
  }, [update]);

  // Sync Orders
  const setOrders = useCallback((data: Order[]) => {
    setOrdersState((current) => {
      // Check for balance paid updates or other changes
      const oldMap = new Map(current.map((o) => [o.id, o]));
      for (const ord of data) {
        const old = oldMap.get(ord.id);
        if (old && old.balancePaid > 0 && ord.balancePaid === 0) {
          void callBackendApi("admin.orders.markBalancePaid", { orderId: ord.id }).catch(() => {});
        }
      }
      writeStored(KEYS.orders, data);
      return data;
    });
  }, []);

  const setPayments = useCallback((data: Payment[]) => {
    update(KEYS.payments, setPaymentsState, data);
  }, [update]);

  // Sync Coupons (Create / Update / Toggle / Delete) to Database
  const pendingCouponSync = useRef<Set<string>>(new Set());

  const setCoupons = useCallback((data: Coupon[]) => {
    const currentList = coupons;
    const currentCodes = new Set(data.map((c) => c.code));
    const deleted = currentList.filter((c) => !currentCodes.has(c.code));
    for (const d of deleted) {
      void callBackendApi("admin.coupons.delete", { code: d.code }).catch(() => {});
    }

    const oldMap = new Map(currentList.map((c) => [c.code, c]));
    for (const item of data) {
      const existing = oldMap.get(item.code);
      if (!existing) {
        if (!pendingCouponSync.current.has(item.code)) {
          pendingCouponSync.current.add(item.code);
          void callBackendApi("admin.coupons.create", item)
            .finally(() => {
              pendingCouponSync.current.delete(item.code);
            });
        }
      } else if (existing.active !== item.active) {
        void callBackendApi("admin.coupons.toggleActive", { code: item.code, active: item.active }).catch(() => {});
      } else if (JSON.stringify(existing) !== JSON.stringify(item)) {
        void callBackendApi("admin.coupons.update", { code: item.code, data: item }).catch(() => {});
      }
    }

    setCouponsState(data);
    writeStored(KEYS.coupons, data);
  }, [coupons]);

  // Sync Settings to Database
  const setSettings = useCallback((data: AdminSettings) => {
    update(KEYS.settings, setSettingsState, data);
    void callBackendApi("admin.settings.update", data).catch(() => {});
  }, [update]);

  // Sync Showcase (Create / Delete) to Database
  const setShowcase = useCallback((data: ShowcaseCustomer[]) => {
    setShowcaseState((current) => {
      const currentIds = new Set(data.map((s) => s.id));
      const deleted = current.filter((s) => !currentIds.has(s.id));
      for (const d of deleted) {
        void callBackendApi("admin.showcase.delete", { id: d.id }).catch(() => {});
      }

      const oldIds = new Set(current.map((s) => s.id));
      for (const item of data) {
        if (!oldIds.has(item.id)) {
          void callBackendApi("admin.showcase.create", item).catch(() => {});
        }
      }

      writeStored(KEYS.showcase, data);
      return data;
    });
  }, []);

  const setCustomDesignOptions = useCallback((data: CustomDesignOption[]) => {
    update(KEYS.customDesignOptions, setCustomDesignOptionsState, data);
    for (const item of data) {
      void callBackendApi("admin.customDesign.update", {
        id: item.id,
        data: {
          price: item.price,
          description: item.description,
        },
      }).catch((err) => {
        console.warn("Could not save custom design option to backend:", err);
      });
    }
  }, [update]);

  const setReviews = useCallback((data: ProductReview[]) => {
    update(KEYS.reviews, setReviewsState, data);
  }, [update]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus, note?: string) => {
    const now = new Date().toISOString();
    const next = orders.map((order) =>
      order.id === id
        ? {
            ...order,
            status,
            statusIndex: STATUSES.indexOf(status),
            updatedAt: now,
            statusHistory: [...order.statusHistory, { status, date: now, ...(note ? { note } : {}) }],
          }
        : order
    );
    setOrdersState(next);
    writeStored(KEYS.orders, next);

    // Call backend order status update
    void callBackendApi("admin.orders.updateStatus", { id, status, note }).catch(() => {});
  }, [orders]);

  const resetDemo = useCallback(() => {
    for (const key of KEYS_TO_DATA) removeStored(key);
    void loadOrSeed();
  }, [loadOrSeed]);

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

    void callBackendApi("admin.backup.restore", { backup }).catch(() => {});
  }, [setCategories, setCoupons, setCustomers, setOrders, setPayments, setProducts, setSettings, setShowcase, setCustomDesignOptions, setReviews]);

  const value = useMemo<AdminData>(() => ({
    products, categories, customers, orders, payments, coupons, settings, showcase, customDesignOptions, reviews, ready,
    setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, setCustomDesignOptions, setReviews,
    updateOrderStatus, resetDemo, restoreBackup
  }), [products, categories, customers, orders, payments, coupons, settings, showcase, customDesignOptions, reviews, ready, setProducts, setCategories, setOrders, setCustomers, setPayments, setCoupons, setSettings, setShowcase, setCustomDesignOptions, setReviews, updateOrderStatus, resetDemo, restoreBackup]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminData {
  const context = useContext(AdminContext);
  if (!context) throw new Error("Admin data must be used within AdminProvider");
  return context;
}
