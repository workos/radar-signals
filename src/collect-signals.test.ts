import { describe, it, expect } from "vitest";
import { collectSignals } from "./collect-signals";

describe("collectSignals", () => {
  it("returns a signal object with an id and collectedAt timestamp", () => {
    const result = collectSignals({ clientId: "client_test_123" });

    expect(result.id).toBeTypeOf("string");
    expect(result.id.length).toBe(26); // ULID length
    expect(result.collectedAt).toBeTypeOf("string");
    expect(() => new Date(result.collectedAt)).not.toThrow();
  });

  it("generates unique ids across calls", () => {
    const a = collectSignals({ clientId: "client_test_123" });
    const b = collectSignals({ clientId: "client_test_123" });

    expect(a.id).not.toBe(b.id);
  });

  it("returns a valid ISO-8601 timestamp", () => {
    const before = new Date().toISOString();
    const result = collectSignals({ clientId: "client_test_123" });
    const after = new Date().toISOString();

    expect(result.collectedAt >= before).toBe(true);
    expect(result.collectedAt <= after).toBe(true);
  });
});
