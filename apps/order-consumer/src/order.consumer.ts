import { PrismaClient, OrderStatus } from "@pos/db";

export const handleOrderCreated = (prisma: PrismaClient) => {
  return async ({ message }: { message: any }): Promise<void> => {
    if (!message.value) return;

    const event = JSON.parse(message.value.toString());

    const result = await prisma.order.updateMany({
      where: {
        id: event.orderId,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.SUCCESS,
        processedAt: new Date(),
      },
    });

    if (result.count > 0) console.log("Order processed:", event.orderId);
    else console.log("Duplicate event ignored:", event.orderId);
  };
};
