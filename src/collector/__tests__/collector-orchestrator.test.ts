import { describe, it, expect } from "vitest";
import { collectAllSignals } from "../index";

describe("collectAllSignals", () => {
  it("returns a complete Signals object with all required fields", async () => {
    const signals = await collectAllSignals({
      puppeteerDetected: false,
      puppeteerDocumentNotAvailable: false,
    });

    // Navigator
    expect(signals).toHaveProperty("timezone");
    expect(signals).toHaveProperty("language");
    expect(signals).toHaveProperty("hardwareConcurrency");
    expect(signals).toHaveProperty("webdriver");
    expect(signals).toHaveProperty("userAgent");
    expect(signals).toHaveProperty("platform");

    // Screen
    expect(signals).toHaveProperty("screenWidth");
    expect(signals).toHaveProperty("screenHeight");

    // Bot detection
    expect(signals.seleniumDetected).toBe(false);
    expect(signals.playwrightDetected).toBe(false);
    expect(signals.phantomDetected).toBe(false);
    expect(signals.nightmareDetected).toBe(false);
    expect(signals.puppeteerDetected).toBe(false);

    // Fingerprints (may be null in jsdom)
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
    expect(signals).toHaveProperty("windowFeatures");
    expect(signals).toHaveProperty("cssKeys");
    expect(signals).toHaveProperty("voices");
    expect(signals).toHaveProperty("mediaMime");
    expect(signals).toHaveProperty("fonts");

    // Browser quirks
    expect(signals).toHaveProperty("rangeErrorLength");
    expect(signals).toHaveProperty("evalStringLength");

    // Timestamps
    expect(signals.createdAtMs).toBeTypeOf("number");
    expect(signals.createdAtMs).toBeGreaterThan(0);
  });
});
