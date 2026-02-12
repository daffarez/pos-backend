import { Kafka } from "kafkajs";
import { PrismaClient, OrderStatus } from "@pos/db";

const prisma = new PrismaClient();

const kafka = new Kafka({
  clientId: "order-consumer",
  brokers: [process.env.KAFKA_BROKER!],
});

const consumer = kafka.consumer({ groupId: "order-service" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      console.log("KAFKA MESSAGE ARRIVED");
      console.log("EVENT:", event);

      // idempotent update
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
    },
  });
}

run();
