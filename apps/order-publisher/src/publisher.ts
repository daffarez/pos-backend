import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const kafka = new Kafka({
  clientId: "order-publisher",
  brokers: [process.env.KAFKA_BROKER!],
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  while (true) {
    const events = await prisma.outboxEvent.findMany({
      where: { published: false },
      take: 10,
      orderBy: { createdAt: "asc" },
    });

    for (const event of events) {
      try {
        await producer.send({
          topic: "order.created",
          messages: [
            {
              key: event.id,
              value: JSON.stringify(event.payload),
            },
          ],
        });

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: { published: true },
        });

        console.log("Published event:", event.id);
      } catch (err) {
        console.error("Publish failed, will retry", err);
      }
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
}

run();
