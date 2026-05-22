import { describe, it, expect, vi } from "vitest";
import { runWebGLWorker } from "../inline-worker";

describe("runWebGLWorker", () => {
  it("returns fallback values when Worker is not available", async () => {
    // jsdom doesn't have Worker, so this tests the fallback path
    const originalWorker = globalThis.Worker;
    // @ts-expect-error — intentionally removing Worker
    delete globalThis.Worker;

    const result = await runWebGLWorker();
    expect(result.renderer).toBeNull();
    expect(result.vendor).toBeNull();
    expect(result.paramsHash).toBeNull();

    // Restore
    if (originalWorker) {
      globalThis.Worker = originalWorker;
    }
  });

  it("returns fallback values when Worker constructor throws (CSP)", async () => {
    const originalWorker = globalThis.Worker;
    // Mock Worker that throws (simulating CSP block)
    globalThis.Worker = vi.fn().mockImplementation(() => {
      throw new Error("CSP blocked");
    }) as unknown as typeof Worker;

    const result = await runWebGLWorker();
    expect(result.renderer).toBeNull();
    expect(result.vendor).toBeNull();
    expect(result.paramsHash).toBeNull();

    globalThis.Worker = originalWorker;
  });
});
