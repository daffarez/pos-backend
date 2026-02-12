import { Kafka } from "kafkajs";
import { PrismaClient } from "@pos/db";
import { publishOutboxEvents } from "./order.publisher";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "order-publisher",
  brokers: [process.env.KAFKA_BROKER!],
});
const producer = kafka.producer();

async function run() {
  await producer.connect();
  while (true) {
    await publishOutboxEvents(prisma, producer);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

run();
