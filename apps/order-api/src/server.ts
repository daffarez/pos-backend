import express from "express";
import bodyParser from "body-parser";
import { PrismaClient, OrderStatus } from "@pos/db";
import { v4 as uuidv4 } from "uuid";
import { OrderCreatedEvent } from "@pos/event-contract";

const app = express();
app.use(bodyParser.json());

const prisma = new PrismaClient();

app.post("/orders", async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey)
    return res.status(400).send("Missing Idempotency-Key header");

  const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existing) return res.json(existing);

  const order = await prisma.$transaction(async (tx: any) => {
    const o = await tx.order.create({
      data: {
        outletId: req.body.outletId,
        total: req.body.total,
        paymentMethod: req.body.paymentMethod,
        status: OrderStatus.PENDING,
        idempotencyKey,
      },
    });

    const event: OrderCreatedEvent = {
      orderId: o.id,
      outletId: o.outletId,
      total: o.total,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
    };

    await tx.outboxEvent.create({
      data: { aggregate: "Order", payload: event },
    });

    return o;
  });

  res.json(order);
});

app.listen(3000, () =>
  console.log("Order API running on http://localhost:3000"),
);
