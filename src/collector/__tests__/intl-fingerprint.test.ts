import { describe, it, expect } from "vitest";
import { collectIntlFingerprint } from "../intl-fingerprint";

describe("collectIntlFingerprint", () => {
  it("returns a non-null hash string", async () => {
    const hash = await collectIntlFingerprint();
    expect(hash).toBeTypeOf("string");
    expect(hash!.length).toBeGreaterThan(0);
  });

  it("returns deterministic results", async () => {
    const a = await collectIntlFingerprint();
    const b = await collectIntlFingerprint();
    expect(a).toBe(b);
  });
});
