import { describe, it, expect, vi } from "vitest";
import { runWebGLWorker } from "../inline-worker";

describe("runWebGLWorker", () => {
  it("returns fallback when Worker is not available", async () => {
    const originalWorker = globalThis.Worker;
    // @ts-expect-error — intentionally removing Worker
    delete globalThis.Worker;

    const result = await runWebGLWorker();
    expect(result.ok).toBe(false);

    if (originalWorker) {
      globalThis.Worker = originalWorker;
    }
  });

  it("returns fallback when Worker constructor throws (CSP)", async () => {
    const originalWorker = globalThis.Worker;
    globalThis.Worker = vi.fn().mockImplementation(() => {
      throw new Error("CSP blocked");
    }) as unknown as typeof Worker;

    const result = await runWebGLWorker();
    expect(result.ok).toBe(false);

    globalThis.Worker = originalWorker;
  });
});
