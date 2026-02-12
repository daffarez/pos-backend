import { PrismaClient } from "@pos/db";
import { Producer } from "kafkajs";

export const publishOutboxEvents = async (
  prisma: PrismaClient,
  producer: Producer,
) => {
  const events = await prisma.outboxEvent.findMany({
    where: { published: false },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    try {
      await producer.send({
        topic: "order.created",
        messages: [{ key: event.id, value: JSON.stringify(event.payload) }],
      });

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { published: true },
      });
    } catch (err) {
      console.error("Publish failed:", err);
    }
  }
  return events.length;
};
