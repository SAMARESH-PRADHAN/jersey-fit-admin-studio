import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers } from "../db/schema/customers.js";
import {
  orderItems,
  orders,
  orderStatusHistory,
  type OrderStatus,
} from "../db/schema/orders.js";
import { payments } from "../db/schema/payments.js";
import { coupons } from "../db/schema/rules.js";
import { PricingEngine } from "./pricing.js";
import type { createOrderInputSchema } from "../validators/index.js";
import type { z } from "zod";
import { productImages } from "../db/schema/catalog.js";

const STATUS_FLOW: OrderStatus[] = [
  "Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export class OrderService {
  static async generateOrderId(): Promise<string> {
    try {
      const res = await db.execute(sql`SELECT nextval('order_id_seq') as next_val`);
      const val = res[0]?.next_val ?? Date.now();
      return `JF-${val}`;
    } catch {
      // Robust fallback if sequence check fails
      try {
        const [lastOrder] = await db
          .select({ id: orders.id })
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(1);

        if (lastOrder && lastOrder.id.startsWith("JF-")) {
          const num = parseInt(lastOrder.id.replace("JF-", ""), 10);
          if (!isNaN(num)) return `JF-${num + 1}`;
        }
      } catch {
        // ignore
      }
      return `JF-${Date.now().toString().slice(-7)}`;
    }
  }

  static async createOrder(input: z.infer<typeof createOrderInputSchema>) {
    // 1. Price everything strictly on the SERVER
    const breakdown = await PricingEngine.priceCart(input.cart, input.couponCode);

    // 2. Validate payment mode constraints
    const hasReadymade = breakdown.items.some((item) => item.family === "readymade");
    if (hasReadymade && input.payMode === "advance") {
      throw new Error("Readymade items require full payment. Advance payment is available only for customisable items.");
    }

    const amountPaid =
      input.payMode === "advance"
        ? Math.round(breakdown.total / 2)
        : breakdown.total;
    const balancePaid = breakdown.total - amountPaid;

    return await db.transaction(async (tx) => {
      // Find or insert customer in database
      const customerEmail = input.customer.email.toLowerCase().trim();
      const [existing] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, customerEmail))
        .limit(1);

      let customerId = existing?.id;
      if (!customerId) {
        customerId = input.customer.id || `customer-${Date.now()}`;
        await tx.insert(customers).values({
          id: customerId,
          name: input.customer.name,
          email: customerEmail,
          phone: input.customer.phone,
          city: input.customer.city || "Mumbai",
          joinedAt: new Date(),
        });
      }

      // Generate sequence-driven Order ID
      const orderId = await OrderService.generateOrderId();
      const now = new Date();

      // Insert Order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: orderId,
          userId: customerId,
          customerName: input.customer.name,
          customerEmail: input.customer.email,
          customerPhone: input.customer.phone,
          address: input.address,
          paymentMethod: input.paymentMethod,
          payMode: input.payMode,
          amountPaid,
          balancePaid,
          subtotal: breakdown.subtotal,
          discount: breakdown.totalTierDiscount + breakdown.couponDiscount,
          coupon: breakdown.couponCode,
          gst: breakdown.gst,
          total: breakdown.total,
          status: "Placed",
          statusIndex: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Insert Order Items
      for (const item of breakdown.items) {
        await tx.insert(orderItems).values({
          orderId,
          productId: item.productId,
          productName: item.productName,
          family: item.family,
          section: item.section,
          category: item.category,
          subCategory: item.subCategory,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          printType: item.printType,
          addOns: item.addOns,
          logoFileUrl: item.logoFileUrl,
          rosterFileUrl: item.rosterFileUrl,
          rosterFileName: item.rosterFileName,
          names: item.names,
          numbers: item.numbers,
          note: item.note,
          discountPct: String(item.discountPct),
        });
      }

      // Record initial status history
      await tx.insert(orderStatusHistory).values({
        orderId,
        status: "Placed",
        date: now,
        note: "Order placed by customer",
      });

      // Record Payments
      await tx.insert(payments).values({
        id: `PAY-${orderId}`,
        orderId,
        customerName: input.customer.name,
        method: input.paymentMethod,
        mode: input.payMode,
        amount: amountPaid,
        date: now,
        status: "Collected",
      });

      if (balancePaid > 0) {
        await tx.insert(payments).values({
          id: `BAL-${orderId}`,
          orderId,
          customerName: input.customer.name,
          method: input.paymentMethod,
          mode: input.payMode,
          amount: balancePaid,
          date: now,
          status: "Pending",
        });
      }

      // Increment coupon usage count if used
      if (breakdown.couponCode) {
        await tx
          .update(coupons)
          .set({
            usageCount: sql`${coupons.usageCount} + 1`,
            updatedAt: now,
          })
          .where(eq(coupons.code, breakdown.couponCode));
      }

      return newOrder;
    });
  }

  static async updateOrderStatus(id: string, status: OrderStatus, note?: string) {
    const statusIndex = STATUS_FLOW.indexOf(status);
    if (statusIndex === -1) {
      throw new Error(`Invalid order status: ${status}`);
    }

    const now = new Date();

    return await db.transaction(async (tx) => {
      const [order] = await tx
        .update(orders)
        .set({
          status,
          statusIndex,
          updatedAt: now,
        })
        .where(eq(orders.id, id))
        .returning();

      if (!order) {
        throw new Error(`Order not found: ${id}`);
      }

      await tx.insert(orderStatusHistory).values({
        orderId: id,
        status,
        date: now,
        note,
      });

      return order;
    });
  }

  static async markBalancePaid(orderId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    if (order.balancePaid <= 0) {
      throw new Error(`Order ${orderId} has no pending balance.`);
    }

    const now = new Date();
    const remaining = order.balancePaid;

    return await db.transaction(async (tx) => {
      // 1. Update order
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          amountPaid: order.total,
          balancePaid: 0,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });
  }

  static async getCustomerOrders(emailOrUserId: string) {
    const clean = emailOrUserId.toLowerCase().trim();
    const customerOrders = await db
      .select()
      .from(orders)
      .where(sql`LOWER(${orders.customerEmail}) = ${clean} OR ${orders.userId} = ${emailOrUserId}`)
      .orderBy(desc(orders.createdAt));

    const allItems = await db.select().from(orderItems);
    const allHistory = await db.select().from(orderStatusHistory);
const allImages = await db.select().from(productImages);
const imageByProduct = new Map<string, string>();
for (const img of allImages.sort((a, b) => a.sortOrder - b.sortOrder)) {
  if (!imageByProduct.has(img.productId)) imageByProduct.set(img.productId, img.url);
}
    const itemsMap = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsMap.has(item.orderId)) itemsMap.set(item.orderId, []);
      itemsMap.get(item.orderId)!.push(item);
    }

    const historyMap = new Map<string, typeof allHistory>();
    for (const hist of allHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
      if (!historyMap.has(hist.orderId)) historyMap.set(hist.orderId, []);
      historyMap.get(hist.orderId)!.push(hist);
    }

    return customerOrders.map((ord) => ({
  ...ord,
  items: (itemsMap.get(ord.id) ?? []).map((it) => ({
    ...it,
    image: it.productId ? (imageByProduct.get(it.productId) ?? null) : null,
  })),
  statusHistory: historyMap.get(ord.id) ?? [],
}));
  }

  static async listOrders(filter?: {
    search?: string;
    status?: string;
    family?: string;
    mode?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 8;
    const offset = (page - 1) * pageSize;

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allItems = await db.select().from(orderItems);
    const allHistory = await db.select().from(orderStatusHistory);

    const itemsMap = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsMap.has(item.orderId)) itemsMap.set(item.orderId, []);
      itemsMap.get(item.orderId)!.push(item);
    }

    const historyMap = new Map<string, typeof allHistory>();
    for (const hist of allHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
      if (!historyMap.has(hist.orderId)) historyMap.set(hist.orderId, []);
      historyMap.get(hist.orderId)!.push(hist);
    }

    const enriched = allOrders.map((ord) => ({
      ...ord,
      items: itemsMap.get(ord.id) ?? [],
      statusHistory: historyMap.get(ord.id) ?? [],
    }));

    const filtered = enriched.filter((ord) => {
      if (filter?.status && filter.status !== "all" && ord.status !== filter.status) return false;
      if (filter?.mode && filter.mode !== "all" && ord.payMode !== filter.mode) return false;
      if (filter?.family && filter.family !== "all") {
        if (!ord.items.some((i) => i.family === filter.family)) return false;
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        const target = `${ord.id} ${ord.customerName} ${ord.customerEmail}`.toLowerCase();
        if (!target.includes(s)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      orders: filtered.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  static async getOrder(id: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(orderStatusHistory.date);

    return {
      ...order,
      items,
      statusHistory: history,
    };
  }
}
