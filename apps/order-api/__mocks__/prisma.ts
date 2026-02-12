import { PrismaClient } from "@prisma/client/extension";
import { vi } from "vitest";

export const prismaMock = {
  order: {
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  outboxEvent: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((cb) => cb(prismaMock)),
} as unknown as PrismaClient;

export const MockPrismaClient = vi.fn(function () {
  return prismaMock;
});
