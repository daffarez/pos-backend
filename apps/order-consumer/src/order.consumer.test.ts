import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../order-api/__mocks__/prisma";
import { handleOrderCreated } from "./order.consumer";

describe("Order Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update order to SUCCESS if status still PENDING", async () => {
    vi.mocked(prismaMock.order.updateMany).mockResolvedValue({ count: 1 });

    const handler = handleOrderCreated(prismaMock);
    const orderId = "order-123";

    await handler({
      message: { value: Buffer.from(JSON.stringify({ orderId })) },
    });

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: orderId, status: "PENDING" },
      data: { status: "SUCCESS", processedAt: expect.any(Date) },
    });
  });

  it("shuold ignore event if order already priocessed (Idempotency)", async () => {
    vi.mocked(prismaMock.order.updateMany).mockResolvedValue({ count: 0 });

    const spyLog = vi.spyOn(console, "log");
    const handler = handleOrderCreated(prismaMock);

    await handler({
      message: {
        value: Buffer.from(JSON.stringify({ orderId: "already-done" })),
      },
    });

    expect(spyLog).toHaveBeenCalledWith(
      "Duplicate event ignored:",
      "already-done",
    );
    expect(prismaMock.order.updateMany).toHaveBeenCalled();
  });

  it("should skip if message value empty", async () => {
    const handler = handleOrderCreated(prismaMock);

    await handler({ message: { value: null } });

    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });
});
