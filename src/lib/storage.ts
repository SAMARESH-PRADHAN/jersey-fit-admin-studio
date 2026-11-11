export const KEYS = {
  products: "jf_admin_products",
  categories: "jf_admin_categories",
  customers: "jf_admin_customers",
  orders: "jf_admin_orders",
  payments: "jf_admin_payments",
  coupons: "jf_admin_coupons",
  settings: "jf_admin_settings",
  showcase: "jf_customer_showcase",
  session: "jf_admin_session",
  theme: "jf_admin_theme",
} as const;

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  // SWAP POINT: replace with API call.
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStored(key: string): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(key);
}