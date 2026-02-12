import { vi, it, expect, describe, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, MockPrismaClient } from "../__mocks__/prisma";

vi.mock("@pos/db", async () => {
  const actual = await vi.importActual<typeof import("@pos/db")>("@pos/db");
  return {
    ...actual,
    PrismaClient: MockPrismaClient,
  };
});

import app from "./orders";

describe("POST /orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return existing order if idempotency key already exists", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: "existing-order-id",
      idempotencyKey: "abc-123",
      status: "PENDING",
    });

    const res = await request(app)
      .post("/orders")
      .set("Idempotency-Key", "abc-123")
      .send({
        outletId: "1",
        total: 10000,
        paymentMethod: "CASH",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("existing-order-id");
    expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: "abc-123" },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("should create a new order and outbox event if idempotency key is new", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const mockOrder = {
      id: "new-order-id",
      outletId: "1",
      total: 10000,
      paymentMethod: "CASH",
      createdAt: new Date(),
    };
    prismaMock.order.create.mockResolvedValue(mockOrder);

    const res = await request(app)
      .post("/orders")
      .set("Idempotency-Key", "new-key")
      .send({
        outletId: "1",
        total: 10000,
        paymentMethod: "CASH",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("new-order-id");
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: "new-key",
        total: 10000,
      }),
    });
    expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        aggregate: "Order",
        payload: expect.objectContaining({
          orderId: "new-order-id",
        }),
      }),
    });
  });

  it("should return 400 if Idempotency-Key is missing", async () => {
    const res = await request(app).post("/orders").send({});
    expect(res.status).toBe(400);
    expect(res.text).toBe("Missing Idempotency-Key");
  });
});
