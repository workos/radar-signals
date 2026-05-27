import { describe, it, expect } from "vitest";
import { collectSignals } from "../index";

describe("collectSignals", () => {
  it("returns a complete Signals object with all required fields", async () => {
    const signals = await collectSignals();

    // Navigator
    expect(signals).toHaveProperty("timezone");
    expect(signals).toHaveProperty("language");
    expect(signals).toHaveProperty("hardwareConcurrency");
    expect(signals).toHaveProperty("webdriver");
    expect(signals).toHaveProperty("userAgent");
    expect(signals).toHaveProperty("platform");

    // Screen
    expect(signals).toHaveProperty("screen");

    // Bot detection
    expect(signals).toHaveProperty("seleniumDetected");
    expect(signals).toHaveProperty("playwrightDetected");
    expect(signals).toHaveProperty("phantomDetected");
    expect(signals).toHaveProperty("nightmareDetected");
    expect(signals).toHaveProperty("puppeteerDetected");

    // Fingerprints (may be undefined in jsdom)
    expect(signals).toHaveProperty("canvasHash");
    expect(signals).toHaveProperty("audioHash");
    expect(signals).toHaveProperty("webGLRenderer");
    expect(signals).toHaveProperty("webGLVendor");
    expect(signals).toHaveProperty("webGLParamsHash");
    expect(signals).toHaveProperty("mathHash");
    expect(signals).toHaveProperty("intlHash");

    // Media preferences
    expect(signals).toHaveProperty("mediaPreferences");

    // Minimal surface
    expect(signals).toHaveProperty("minimalSurface");

    // Worker
    expect(signals).toHaveProperty("worker");
    expect(signals.worker.ok).toBe(false); // No worker configured by default

    // Timestamps
    expect(signals.createdAtMs).toBeTypeOf("number");
    expect(signals.createdAtMs).toBeGreaterThan(0);
  });
});
