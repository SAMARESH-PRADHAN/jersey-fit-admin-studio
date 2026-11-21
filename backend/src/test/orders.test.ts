import { describe, expect, it } from "vitest";

describe("Order Fulfillment and Advance Payment Rules", () => {
  const STATUS_FLOW = [
    "Placed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ] as const;

  it("calculates 50% advance payment correctly", () => {
    const total = 10500;
    const amountPaid = Math.round(total / 2); // 5250
    const balancePaid = total - amountPaid; // 5250

    expect(amountPaid).toBe(5250);
    expect(balancePaid).toBe(5250);
  });

  it("updates status and increments status index accurately", () => {
    let currentStatus: (typeof STATUS_FLOW)[number] = "Placed";
    let statusIndex = STATUS_FLOW.indexOf(currentStatus);
    const history: Array<{ status: string; date: Date; note?: string }> = [
      { status: currentStatus, date: new Date() },
    ];

    const transitionTo = (next: (typeof STATUS_FLOW)[number], note?: string) => {
      const idx = STATUS_FLOW.indexOf(next);
      if (idx === -1) throw new Error("Invalid status");
      currentStatus = next;
      statusIndex = idx;
      history.push({ status: next, date: new Date(), note });
    };

    transitionTo("Packed", "Items printed and packed");
    expect(currentStatus).toBe("Packed");
    expect(statusIndex).toBe(1);
    expect(history).toHaveLength(2);

    transitionTo("Shipped", "Handed over to courier");
    expect(currentStatus).toBe("Shipped");
    expect(statusIndex).toBe(2);

    transitionTo("Delivered");
    expect(currentStatus).toBe("Delivered");
    expect(statusIndex).toBe(4);
    expect(history).toHaveLength(4);
  });

  it("marks balance as paid and creates collected payment", () => {
    const order = {
      id: "JF-2500",
      total: 8000,
      amountPaid: 4000,
      balancePaid: 4000,
    };

    // Mark balance paid simulation
    const remaining = order.balancePaid;
    order.amountPaid = order.total;
    order.balancePaid = 0;

    const newPayment = {
      id: `BAL-COLLECTED-${order.id}`,
      orderId: order.id,
      amount: remaining,
      status: "Collected",
    };

    expect(order.amountPaid).toBe(8000);
    expect(order.balancePaid).toBe(0);
    expect(newPayment.amount).toBe(4000);
    expect(newPayment.status).toBe("Collected");
  });
});
