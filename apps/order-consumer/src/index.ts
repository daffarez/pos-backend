import { Kafka } from "kafkajs";
import { PrismaClient } from "@pos/db";
import { handleOrderCreated } from "./order.consumer";
import config from "@pos/config";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "order-service",
  brokers: [config.get("kafkaBroker")],
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
