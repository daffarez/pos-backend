import { PrismaClient } from "@pos/db";
import { Kafka } from "kafkajs";

const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new Kafka({ brokers: [kafkaBroker] });
const producer = kafka.producer();

const prisma = new PrismaClient();

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
