import { prisma } from "@pos/db";
import { Kafka } from "kafkajs";

const kafka = new Kafka({ brokers: ["localhost:9092"] });
const producer = kafka.producer();

async function run() {
  await producer.connect();

  while (true) {
    const events = await prisma.outboxEvent.findMany({
      where: { published: false },
      take: 10,
    });

    for (const event of events) {
      await producer.send({
        topic: "order.created",
        messages: [{ value: JSON.stringify(event.payload) }],
      });

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { published: true },
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
}

run();
