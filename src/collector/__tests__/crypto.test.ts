import { describe, it, expect } from "vitest";
import { bufferToBase64Url, sha256Base64Url, hashList } from "../crypto";

describe("crypto", () => {
  describe("bufferToBase64Url", () => {
    it("encodes an empty buffer", () => {
      const buf = new ArrayBuffer(0);
      expect(bufferToBase64Url(buf)).toBe("");
    });

    it("encodes bytes with base64url characters (no +, /, or =)", () => {
      const buf = new Uint8Array([255, 254, 253, 252]).buffer;
      const result = bufferToBase64Url(buf);
      expect(result).not.toContain("+");
      expect(result).not.toContain("/");
      expect(result).not.toContain("=");
    });
  });

  describe("sha256Base64Url", () => {
    it("hashes a known string deterministically", async () => {
      const a = await sha256Base64Url("hello");
      const b = await sha256Base64Url("hello");
      expect(a).toBe(b);
      expect(a).toBeTypeOf("string");
      expect(a!.length).toBeGreaterThan(0);
    });

    it("produces different hashes for different inputs", async () => {
      const a = await sha256Base64Url("hello");
      const b = await sha256Base64Url("world");
      expect(a).not.toBe(b);
    });
  });

  describe("hashList", () => {
    it("hashes a list of strings deterministically", async () => {
      const a = await hashList(["b", "a", "c"]);
      const b = await hashList(["a", "c", "b"]);
      expect(a.hash).toBe(b.hash);
    });

    it("produces different hashes for different lists", async () => {
      const a = await hashList(["a", "b"]);
      const b = await hashList(["a", "b", "c"]);
      expect(a.hash).not.toBe(b.hash);
    });

    it("returns count of canonical items", async () => {
      const result = await hashList(["a", "b", "c"]);
      expect(result.count).toBe(3);
    });
  });
});
