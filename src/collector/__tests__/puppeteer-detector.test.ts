import { describe, it, expect, afterEach } from "vitest";
import {
  setupPuppeteerDetector,
  _resetDetectorSingleton,
  type PuppeteerDetectorAPI,
} from "../puppeteer-detector";

describe("setupPuppeteerDetector (basic)", () => {
  let detector: PuppeteerDetectorAPI;

  afterEach(() => {
    _resetDetectorSingleton();
  });

  it("starts with detected = false", () => {
    detector = setupPuppeteerDetector();
    const state = detector.snapshot();
    expect(state.detected).toBe(false);
    expect(state.documentNotAvailable).toBe(false);
  });

  it("destroy() is idempotent", () => {
    detector = setupPuppeteerDetector();
    detector.destroy();
    detector.destroy(); // Should not throw
    const state = detector.snapshot();
    expect(state.detected).toBe(false);
  });

  it("querySelector still works after patching", () => {
    detector = setupPuppeteerDetector();
    // Should not throw — patched querySelector should pass through
    const result = document.querySelector("body");
    expect(result).not.toBeNull();
  });

  it("querySelectorAll still works after patching", () => {
    detector = setupPuppeteerDetector();
    const result = document.querySelectorAll("div");
    expect(result).toBeDefined();
  });

  it("restores original prototypes after destroy()", () => {
    const origQs = Document.prototype.querySelector;
    detector = setupPuppeteerDetector();
    // Should be patched
    expect(Document.prototype.querySelector).not.toBe(origQs);
    detector.destroy();
    // Should be restored
    expect(Document.prototype.querySelector).toBe(origQs);
  });
});
