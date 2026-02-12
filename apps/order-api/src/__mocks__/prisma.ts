import { vi } from "vitest";

export const prismaMock = {
  order: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  outboxEvent: {
    create: vi.fn(),
  },
  $transaction: vi.fn((cb) => cb(prismaMock)),
};

export const MockPrismaClient = vi.fn(function () {
  return prismaMock;
});
