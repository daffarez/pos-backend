import { vi, describe, it, expect, beforeEach } from "vitest";
import { publishOutboxEvents } from "./order.publisher";
import { prismaMock } from "../../order-api/__mocks__/prisma";

describe("Order Publisher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const producerMock = { send: vi.fn() } as any;

  it("should process events", async () => {
    vi.mocked(prismaMock.outboxEvent.findMany).mockResolvedValue([
      { id: "1", payload: {} },
    ] as any);

    await publishOutboxEvents(prismaMock as any, producerMock);

    expect(producerMock.send).toHaveBeenCalled();
    expect(prismaMock.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { published: true } }),
    );
  });

  it("should log error if delivery to Kafka failed", async () => {
    vi.mocked(prismaMock.outboxEvent.findMany).mockResolvedValue([
      { id: "evt-fail", payload: { data: "test" }, published: false },
    ] as any);

    const kafkaError = new Error("Kafka Connection Lost");
    vi.mocked(producerMock.send).mockRejectedValue(kafkaError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await publishOutboxEvents(prismaMock as any, producerMock);

    expect(consoleSpy).toHaveBeenCalledWith("Publish failed:", kafkaError);
    expect(prismaMock.outboxEvent.update).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
