import { describe, it, expect } from "vitest";
import { collectMathFingerprint } from "../math-fingerprint";

describe("collectMathFingerprint", () => {
  it("returns a non-null hash string", async () => {
    const hash = await collectMathFingerprint();
    expect(hash).toBeTypeOf("string");
    expect(hash!.length).toBeGreaterThan(0);
  });

  it("returns deterministic results", async () => {
    const a = await collectMathFingerprint();
    const b = await collectMathFingerprint();
    expect(a).toBe(b);
  });
});
