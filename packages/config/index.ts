import convict from "convict";
import "dotenv/config";

const config = convict({
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 3000,
    env: "API_PORT",
  },
  dbUrl: {
    doc: "Database connection string.",
    format: String,
    default:
      "postgresql://postgres:postgres@localhost:5433/posdb?schema=public",
    env: "DATABASE_URL",
    sensitive: true,
  },
  kafkaBroker: {
    doc: "Kafka broker address.",
    format: String,
    default: "localhost:9092",
    env: "KAFKA_BROKER",
  },
});

config.validate({ allowed: "strict" });

export default config;
