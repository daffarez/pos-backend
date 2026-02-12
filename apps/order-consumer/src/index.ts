import { Kafka } from "kafkajs";
import { PrismaClient } from "@pos/db";
import { handleOrderCreated } from "./order.consumer";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "order-service",
  brokers: [process.env.KAFKA_BROKER!],
});

const consumer = kafka.consumer({ groupId: "order-service" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: true });

  await consumer.run({
    eachMessage: async (payload) => {
      await handleOrderCreated(prisma)(payload);
    },
  });
}

run();
