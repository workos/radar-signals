import { describe, it, expect, afterEach } from "vitest";
import { installPuppeteerDetector } from "../puppeteer-detector";

describe("installPuppeteerDetector", () => {
  let detector: ReturnType<typeof installPuppeteerDetector>;

  afterEach(() => {
    // Always restore prototypes
    detector?.restore();
  });

  it("starts with puppeteerDetected = false", () => {
    detector = installPuppeteerDetector();
    const state = detector.getState();
    expect(state.puppeteerDetected).toBe(false);
    expect(state.puppeteerDocumentNotAvailable).toBe(false);
  });

  it("restore() is idempotent", () => {
    detector = installPuppeteerDetector();
    detector.restore();
    detector.restore(); // Should not throw
    const state = detector.getState();
    expect(state.puppeteerDetected).toBe(false);
  });

  it("querySelector still works after patching", () => {
    detector = installPuppeteerDetector();
    // Should not throw — patched querySelector should pass through
    const result = document.querySelector("body");
    expect(result).not.toBeNull();
  });

  it("querySelectorAll still works after patching", () => {
    detector = installPuppeteerDetector();
    const result = document.querySelectorAll("div");
    expect(result).toBeDefined();
  });

  it("restores original prototypes after restore()", () => {
    const origQs = Document.prototype.querySelector;
    detector = installPuppeteerDetector();
    // Should be patched
    expect(Document.prototype.querySelector).not.toBe(origQs);
    detector.restore();
    // Should be restored
    expect(Document.prototype.querySelector).toBe(origQs);
  });
});
