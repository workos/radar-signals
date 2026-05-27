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

  it("refresh() returns a new token", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token1 = await radar.getToken();
    const token2 = await radar.refresh();
    expect(token2).not.toBe(token1);
    expect(token2.length).toBe(26);
    radar.destroy();
  });

  it("destroy() is idempotent", () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    radar.destroy();
    radar.destroy(); // Should not throw
  });

  it("posts signals to the API", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    await radar.getToken();

    expect(fetch).toHaveBeenCalled();
    const calls = vi.mocked(fetch).mock.calls;
    const signalCall = calls.find(([url]) =>
      (url as string).includes("/radar/signals"),
    );
    expect(signalCall).toBeDefined();
    const [, options] = signalCall!;
    expect(options!.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer client_test_123",
      }),
    );

    radar.destroy();
  });

  it("uses custom apiUrl when provided", async () => {
    const radar = WorkOSRadar.init({
      clientId: "client_test_123",
      apiUrl: "https://custom.api.com",
    });
    await radar.getToken();

    const calls = vi.mocked(fetch).mock.calls;
    const signalCall = calls.find(([url]) =>
      (url as string).includes("custom.api.com"),
    );
    expect(signalCall).toBeDefined();

    radar.destroy();
  });

  it("still returns a token when API POST fails (fail-open)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token = await radar.getToken();
    expect(token).toBeTypeOf("string");
    expect(token.length).toBe(26);
    radar.destroy();
  });
});
