import { Kafka } from "kafkajs";
import { prisma } from "@pos/db";

const kafka = new Kafka({ brokers: ["localhost:9092"] });
const consumer = kafka.consumer({ groupId: "order-service" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }: any) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());

      try {
        // simulasikan kirim ke Odoo
        console.log("Sending order to Odoo:", event.orderId);

        await prisma.order.update({
          where: { id: event.orderId },
          data: { status: "SUCCESS" },
        });
      } catch (err) {
        console.error("Failed to send order to Odoo:", err);
        // tetap PENDING untuk retry
      }
    },
  });
}

run();
