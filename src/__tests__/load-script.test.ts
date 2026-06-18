import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  // Clean up window globals.
  delete (window as unknown as Record<string, unknown>).__WorkOSRadarCollector;
  delete (window as unknown as Record<string, unknown>).__WorkOSRadarConfig;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("loadCollectorsScript", () => {
  it("resolves immediately if collector already has signalsId", async () => {
    (window as unknown as Record<string, unknown>).__WorkOSRadarCollector = {
      collectSignals: vi.fn(),
      signalsId: "existing-token-123",
    };

    const { loadCollectorsScript: load } = await import("../load-script");
    const api = await load({ clientId: "client_test" });
    expect(api.getToken()).toBe("existing-token-123");
  });

  it("waits for signalsId via defineProperty trap", async () => {
    const collector = {
      collectSignals: vi.fn(),
      signalsId: null as string | null,
    };

    const mockScript: Record<string, unknown> = {};

    vi.stubGlobal("document", {
      createElement: () => mockScript,
      head: { appendChild: vi.fn() },
    });

    const { loadCollectorsScript: load } = await import("../load-script");
    const promise = load({ clientId: "client_test" });

    // Simulate script loading: set the global, then fire onload.
    (window as unknown as Record<string, unknown>).__WorkOSRadarCollector =
      collector;
    (mockScript.onload as () => void)();

    // Simulate the collector setting signalsId after async work.
    collector.signalsId = "async-token-456";

    const api = await promise;
    expect(api.getToken()).toBe("async-token-456");
  });

  it("resolves with empty token on timeout", async () => {
    const collector = {
      collectSignals: vi.fn(),
      signalsId: null as string | null,
    };

    const mockScript: Record<string, unknown> = {};

    vi.stubGlobal("document", {
      createElement: () => mockScript,
      head: { appendChild: vi.fn() },
    });

    const { loadCollectorsScript: load } = await import("../load-script");
    const promise = load({ clientId: "client_test" });

    // Simulate script loading.
    (window as unknown as Record<string, unknown>).__WorkOSRadarCollector =
      collector;
    (mockScript.onload as () => void)();

    // Advance past the timeout (10s).
    vi.advanceTimersByTime(10_000);

    const api = await promise;
    expect(api.getToken()).toBe("");
  });

  it("rejects if collector global is not found after script loads", async () => {
    const mockScript: Record<string, unknown> = {};

    vi.stubGlobal("document", {
      createElement: () => mockScript,
      head: { appendChild: vi.fn() },
    });

    const { loadCollectorsScript: load } = await import("../load-script");
    const promise = load({ clientId: "client_test" });

    // Fire onload without setting the global.
    (mockScript.onload as () => void)();

    await expect(promise).rejects.toThrow(
      "__WorkOSRadarCollector global not found",
    );
  });

  it("rejects on script error", async () => {
    const mockScript: Record<string, unknown> = {};

    vi.stubGlobal("document", {
      createElement: () => mockScript,
      head: { appendChild: vi.fn() },
    });

    const { loadCollectorsScript: load } = await import("../load-script");
    const promise = load({ clientId: "client_test" });

    (mockScript.onerror as () => void)();

    await expect(promise).rejects.toThrow("Failed to load Radar collectors");
  });
});

describe("getCollectorFromWindow", () => {
  it("returns null when collector has no signalsId", async () => {
    (window as unknown as Record<string, unknown>).__WorkOSRadarCollector = {
      collectSignals: vi.fn(),
      signalsId: null,
    };

    const { getCollectorFromWindow: get } = await import("../load-script");
    expect(get()).toBeNull();
  });

  it("returns wrapper when collector has signalsId", async () => {
    (window as unknown as Record<string, unknown>).__WorkOSRadarCollector = {
      collectSignals: vi.fn(),
      signalsId: "token-789",
    };

    const { getCollectorFromWindow: get } = await import("../load-script");
    const api = get();
    expect(api).not.toBeNull();
    expect(api!.getToken()).toBe("token-789");
  });
});
