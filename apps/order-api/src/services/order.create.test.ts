import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock, MockPrismaClient } from "../../__mocks__/prisma";

vi.mock("@pos/db", () => {
  return {
    PrismaClient: MockPrismaClient,
    OrderStatus: {
      PENDING: "PENDING",
      SUCCESS: "SUCCESS",
      FAILED: "FAILED",
    },
  };
});

import { createOrder } from "./order.create";

describe("createOrder service", () => {
  const mockReq = {
    headers: { "idempotency-key": "test-key" },
    body: {
      outletId: "outlet-1",
      total: 1000,
      paymentMethod: "CASH",
    },
  } as any;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    json: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create order and outbox event within a transaction", async () => {
    vi.mocked(prismaMock.order.findUnique).mockResolvedValue(null);

    const mockOrder = {
      id: "order-123",
      outletId: "outlet-1",
      total: 1000,
      paymentMethod: "CASH",
      createdAt: new Date(),
    };
    vi.mocked(prismaMock.order.create).mockResolvedValue(mockOrder as any);
    vi.mocked(prismaMock.outboxEvent.create).mockResolvedValue({
      id: "outbox-1",
    } as any);

    await createOrder(mockReq, mockRes);

    expect(prismaMock.$transaction).toHaveBeenCalled();

    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey: "test-key" }),
      }),
    );

    expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aggregate: "Order",
          payload: expect.objectContaining({ orderId: "order-123" }),
        }),
      }),
    );

    expect(mockRes.json).toHaveBeenCalledWith(mockOrder);
  });

  it("should return 400 if Idempotency-Key header is missing", async () => {
    const reqWithoutKey = {
      headers: {}, // Kosong
      body: { outletId: "1", total: 100 },
    } as any;

    await createOrder(reqWithoutKey, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("Missing Idempotency-Key");
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
  });

  it("should return existing order if idempotency key is already used", async () => {
    const existingOrder = {
      id: "ord-already-exists",
      idempotencyKey: "test-key",
      status: "PENDING",
      total: 1000,
    };

    vi.mocked(prismaMock.order.findUnique).mockResolvedValue(
      existingOrder as any,
    );

    await createOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(existingOrder);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
