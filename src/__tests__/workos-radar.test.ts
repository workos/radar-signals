import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkOSRadar } from "../index";

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkOSRadar", () => {
  it("can be initialized with init()", () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    expect(radar).toBeInstanceOf(WorkOSRadar);
    radar.destroy();
  });

  it("getToken() returns a ULID string", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token = await radar.getToken();
    expect(token).toBeTypeOf("string");
    expect(token.length).toBe(26); // ULID length
    radar.destroy();
  });

  it("getToken() returns the same token on multiple calls", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token1 = await radar.getToken();
    const token2 = await radar.getToken();
    expect(token1).toBe(token2);
    radar.destroy();
  });

  it("getTokenSync() returns a ULID string", () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token = radar.getTokenSync();
    expect(token).toBeTypeOf("string");
    expect(token.length).toBe(26);
    radar.destroy();
  });

  it("destroy() is idempotent", () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    radar.destroy();
    radar.destroy(); // Should not throw
  });
});
