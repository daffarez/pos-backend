import { Request, Response } from "express";
import { OrderCreatedEvent } from "../types/order.type";
import { PrismaClient, OrderStatus } from "@pos/db";

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey) return res.status(400).send("Missing Idempotency-Key");

  // idempotency protection
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
  });
  console.log("exist", existing);
  if (existing) return res.json(existing);

  const order = await prisma.$transaction(async (tx) => {
    const orderDetails = await tx.order.create({
      data: {
        outletId: req.body.outletId,
        total: req.body.total,
        paymentMethod: req.body.paymentMethod,
        idempotencyKey,
        status: OrderStatus.PENDING,
      },
    });

    const event: OrderCreatedEvent = {
      orderId: orderDetails.id,
      outletId: orderDetails.outletId,
      total: orderDetails.total,
      paymentMethod: orderDetails.paymentMethod,
      createdAt: orderDetails.createdAt.getTime(),
    };

    await tx.outboxEvent.create({
      data: {
        aggregate: "Order",
        payload: event,
      },
    });

    return orderDetails;
  });

  res.json(order);
};
