# POS Backend

## Overview

This project simulates a real-world POS (Point of Sale) backend that reliably processes orders and delivers them to an external system using an event-driven architecture.

The core goal is reliability. In production, third‑party services fail, networks time out, and POS devices retry requests. If the backend is not designed carefully, duplicate orders or lost orders will happen.

To prevent that, this project implements:

- Idempotency Key handling
- Database status tracking
- Outbox Pattern
- Kafka messaging

## Architecture

The backend is split into 3 services:

### 1. Order API

Receives orders from POS devices.

Responsibilities:

- Validate Idempotency-Key
- Prevent duplicate order creation
- Store order with status PENDING
- Write an event to the Outbox table
- Return the created order

### 2. Order Publisher

Background worker that publishes database events to Kafka.

Responsibilities:

- Poll OutboxEvent table
- Publish events to Kafka topic order.created
- Mark events as published = true

This guarantees that even if Kafka is temporarily down, the event is not lost.

### 3. Order Consumer

Consumes Kafka events and sends them to an external system.

Responsibilities:

- Read order.created messages
- Send order to 3rd party
- Update order status to SUCCESS
- Set processedAt

## Monorepo Structure

```
apps/
    order-api/ # HTTP API (Express)
    order-publisher/ # Outbox → Kafka worker
    order-consumer/ # Kafka → 3rd party worker
packages/
    db/ # Prisma schema and client
docker-compose.yml
```

## Prerequisites

- Node.js 20+
- Docker
- PostgreSQL

## Environment Variables

Create a `.env` file at the project root:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/posdb?schema=public"
KAFKA_BROKER=localhost:9092
```

## Start Infrastructure (Postgres + Kafka)

```
docker compose up -d
```

Services started:

- PostgreSQL (5433:5432)
- Zookeeper (2181:2181)
- Kafka (9092:9092)

Wait ~15–25 seconds for Kafka to fully start.

## Prisma Setup

Generate Prisma client:

```
npm install
npx prisma generate --schema=packages/db/schema.prisma
```

Run migration:

```
npx prisma migrate dev --schema=packages/db/schema.prisma
```

## Run the Services

```
npm run dev
```

## Run the Tests

```
npm run test
npm run test:coverage
```

## What This Project Demonstrates

- At‑least‑once delivery handling
- Idempotent APIs
- Event‑driven architecture
- Eventually consistent systems
- Reliable integration with external services

The design prioritizes never losing an order over immediate response speed.
