import express from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.post("/orders", async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey) return res.status(400).send("Missing Idempotency-Key");

  // idempotency protection
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return res.json(existing);

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        outletId: req.body.outletId,
        total: req.body.total,
        paymentMethod: req.body.paymentMethod,
        idempotencyKey,
        status: OrderStatus.PENDING,
      },
    });

    const event = {
      orderId: o.id,
      outletId: o.outletId,
      total: o.total,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.getTime(),
    };

    await tx.outboxEvent.create({
      data: {
        aggregate: "Order",
        payload: event,
      },
    });

    return o;
  });

  res.json(order);
});

app.listen(3000, () =>
  console.log("Order API running on http://localhost:3000"),
);
