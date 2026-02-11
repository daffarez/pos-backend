import { Kafka } from "kafkajs";
import { PrismaClient } from "@pos/db";

const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new Kafka({ brokers: [kafkaBroker] });
const consumer = kafka.consumer({ groupId: "order-service" });

const prisma = new PrismaClient();

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());

      try {
        console.log("Sending order to Odoo:", event.orderId);

        await prisma.order.update({
          where: { id: event.orderId },
          data: { status: "SUCCESS" },
        });
      } catch (err) {
        console.error("Failed to send order to Odoo:", err);
      }
    },
  });
}

run();
