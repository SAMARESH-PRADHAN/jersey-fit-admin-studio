import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers } from "../db/schema/customers.js";
import { orderItems, orders } from "../db/schema/orders.js";
import { payments } from "../db/schema/payments.js";

export class CustomerService {
  static async listCustomers(search?: string) {
    const allCustomers = await db.select().from(customers);
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const records = allCustomers.map((cust) => {
      const ownOrders = allOrders.filter(
        (o) => o.customerEmail === cust.email || o.userId === cust.id,
      );
      const spend = ownOrders.reduce((sum, o) => sum + o.total, 0);
      const sorted = ownOrders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const last = sorted[0]?.createdAt ? new Date(sorted[0].createdAt).toISOString() : undefined;

      let customCount = 0;
      let readyCount = 0;

      for (const ord of ownOrders) {
        const items = itemsByOrder.get(ord.id) ?? [];
        if (items.some((i) => i.family === "customisable")) customCount++;
        if (items.some((i) => i.family === "readymade")) readyCount++;
      }

      return {
        ...cust,
        orderCount: ownOrders.length,
        spend,
        avg: ownOrders.length > 0 ? Math.round(spend / ownOrders.length) : 0,
        last,
        custom: customCount,
        ready: readyCount,
      };
    });

    if (!search) return records;

    const s = search.toLowerCase();
    return records.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.city.toLowerCase().includes(s),
    );
  }

  static async getCustomerDetail(id: string) {
    const [cust] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!cust) return null;

    const ownOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt));

    const allItems = await db.select().from(orderItems);
    const itemsMap = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsMap.has(item.orderId)) itemsMap.set(item.orderId, []);
      itemsMap.get(item.orderId)!.push(item);
    }

    const enrichedOrders = ownOrders.map((o) => ({
      ...o,
      items: itemsMap.get(o.id) ?? [],
    }));

    const spend = ownOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      customer: cust,
      spend,
      orderCount: ownOrders.length,
      avg: ownOrders.length > 0 ? Math.round(spend / ownOrders.length) : 0,
      orders: enrichedOrders,
    };
  }
}

export class PaymentService {
  static async listPayments() {
    return await db.select().from(payments).orderBy(desc(payments.date));
  }

  static async getPaymentsSummary() {
    const all = await db.select().from(payments);
    const now = Date.now();

    const collectedSince = (ms: number) =>
      all
        .filter(
          (p) =>
            p.status === "Collected" &&
            now - new Date(p.date).getTime() < ms,
        )
        .reduce((sum, p) => sum + p.amount, 0);

    const lifetimeCollected = all
      .filter((p) => p.status === "Collected")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingBalance = all
      .filter((p) => p.status === "Pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const methods = ["UPI", "Card", "Net Banking", "COD"] as const;
    const byMethod = methods.map((m) => ({
      name: m,
      value: all
        .filter((p) => p.method === m && p.status === "Collected")
        .reduce((sum, p) => sum + p.amount, 0),
    }));

    return {
      today: collectedSince(86400000),
      last7Days: collectedSince(7 * 86400000),
      last30Days: collectedSince(30 * 86400000),
      lifetime: lifetimeCollected,
      pending: pendingBalance,
      byMethod,
    };
  }
}
