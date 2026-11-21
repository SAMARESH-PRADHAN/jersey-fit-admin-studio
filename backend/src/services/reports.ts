import { db } from "../db/index.js";
import { customers } from "../db/schema/customers.js";
import { orderItems, orders } from "../db/schema/orders.js";
import { payments } from "../db/schema/payments.js";
import { products } from "../db/schema/catalog.js";

const SECTIONS = [
  "Custom Team Jersey",
  "Custom Premium Collection",
  "Sports Top Wear",
  "Winter Sports Wear",
] as const;

const STATUSES = [
  "Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

export class ReportsService {
  static async getDashboardStats(period: "Daily" | "Weekly" | "Monthly") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "Weekly") {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    } else if (period === "Monthly") {
      start.setDate(1);
    }

    const allOrders = await db.select().from(orders);
    const allCustomers = await db.select().from(customers);
    const allProducts = await db.select().from(products);
    const allPayments = await db.select().from(payments);
    const allItems = await db.select().from(orderItems);

    const periodOrders = allOrders.filter((o) => new Date(o.createdAt) >= start);

    const revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
    const balancePending = periodOrders.reduce((sum, o) => sum + o.balancePaid, 0);
    const pendingOrdersCount = periodOrders.filter((o) => o.status !== "Delivered").length;
    const aov = periodOrders.length > 0 ? Math.round(revenue / periodOrders.length) : 0;

    const statusesData = STATUSES.map((status) => ({
      name: status,
      value: periodOrders.filter((o) => o.status === status).length,
    }));

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const sectionData = SECTIONS.map((section) => ({
      name: section.replace("Custom ", ""),
      revenue: periodOrders
        .filter((o) => (itemsByOrder.get(o.id) ?? []).some((item) => item.section === section))
        .reduce((sum, o) => sum + o.total, 0),
    }));

    const bucketCount =
      period === "Daily"
        ? 24
        : period === "Weekly"
          ? 7
          : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const revenueTrend = Array.from({ length: bucketCount }, (_, index) => {
      const label =
        period === "Daily"
          ? `${String(index).padStart(2, "0")}:00`
          : period === "Weekly"
            ? (["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ?? "")
            : String(index + 1);

      const rows = periodOrders.filter((order) => {
        const date = new Date(order.createdAt);
        return period === "Daily"
          ? date.getHours() === index
          : period === "Weekly"
            ? (date.getDay() + 6) % 7 === index
            : date.getDate() === index + 1;
      });

      return {
        name: label,
        revenue: rows.reduce((sum, o) => sum + o.total, 0),
        orders: rows.length,
      };
    });

    const topProducts = allProducts
      .map((prod) => {
        const units = allItems
          .filter((item) => item.productId === prod.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        return {
          id: prod.id,
          name: prod.name,
          section: prod.section,
          price: prod.price,
          count: units,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      revenue,
      orderCount: periodOrders.length,
      customerCount: allCustomers.length,
      aov,
      pendingOrdersCount,
      balancePending,
      statusesData,
      sectionData,
      revenueTrend,
      topProducts,
    };
  }

  static async getAnalytics(range?: { start?: string; end?: string }, family = "all") {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);
    const allCustomers = await db.select().from(customers);

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const filtered = allOrders.filter((o) => {
      if (range?.start && new Date(o.createdAt) < new Date(range.start)) return false;
      if (range?.end && new Date(o.createdAt) > new Date(range.end)) return false;
      if (family !== "all") {
        const items = itemsByOrder.get(o.id) ?? [];
        if (!items.some((i) => i.family === family)) return false;
      }
      return true;
    });

    const bySection = SECTIONS.map((section) => {
      const match = filtered.filter((o) =>
        (itemsByOrder.get(o.id) ?? []).some((item) => item.section === section),
      );
      return {
        section: section.replace("Custom ", ""),
        revenue: match.reduce((sum, o) => sum + o.total, 0),
        orders: match.length,
      };
    });

    const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
    const sizeDistribution = sizes.map((size) => ({
      size,
      count: filtered.reduce((sum, o) => {
        const items = itemsByOrder.get(o.id) ?? [];
        return (
          sum +
          items
            .filter((i) => i.size === size)
            .reduce((q, i) => q + i.quantity, 0)
        );
      }, 0),
    }));

    const topCustomers = allCustomers
      .map((cust) => {
        const spend = filtered
          .filter((o) => o.customerEmail === cust.email || o.userId === cust.id)
          .reduce((sum, o) => sum + o.total, 0);
        return {
          id: cust.id,
          name: cust.name,
          city: cust.city,
          spend,
        };
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8);

    return {
      bySection,
      sizeDistribution,
      topCustomers,
    };
  }

  static async exportCsv(entity: "orders" | "products" | "customers" | "payments", records: unknown[]) {
    if (!records || records.length === 0) return "";
    const csvCell = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const keys = Object.keys(records[0] as Record<string, unknown>);
    const header = keys.map(csvCell).join(",");
    const rows = records.map((row) =>
      keys
        .map((k) => {
          const v = (row as Record<string, unknown>)[k];
          return csvCell(typeof v === "object" ? JSON.stringify(v) : v);
        })
        .join(","),
    );
    return [header, ...rows].join("\r\n");
  }
}
