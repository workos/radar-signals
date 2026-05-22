import { describe, it, expect } from "vitest";
import { collectNavigatorSignals } from "../navigator-signals";

describe("collectNavigatorSignals", () => {
  it("returns an object with all expected navigator signal fields", async () => {
    const signals = await collectNavigatorSignals();

    // Verify all fields exist (may be null in jsdom)
    expect(signals).toHaveProperty("timezone");
    expect(signals).toHaveProperty("language");
    expect(signals).toHaveProperty("hardwareConcurrency");
    expect(signals).toHaveProperty("webdriver");
    expect(signals).toHaveProperty("userAgent");
    expect(signals).toHaveProperty("appVersion");
    expect(signals).toHaveProperty("platform");
    expect(signals).toHaveProperty("maxTouchPoints");
    expect(signals).toHaveProperty("deviceMemory");
    expect(signals).toHaveProperty("devicePixelRatio");
    expect(signals).toHaveProperty("documentHidden");
    expect(signals).toHaveProperty("documentVisibilityState");
    expect(signals).toHaveProperty("screenWidth");
    expect(signals).toHaveProperty("screenHeight");
    expect(signals).toHaveProperty("screenAvailWidth");
    expect(signals).toHaveProperty("screenAvailHeight");
    expect(signals).toHaveProperty("screenColorDepth");
    expect(signals).toHaveProperty("screenPixelDepth");
    expect(signals).toHaveProperty("screenOrientationType");
    expect(signals).toHaveProperty("screenOrientationAngle");
    expect(signals).toHaveProperty("permissionCamera");
    expect(signals).toHaveProperty("permissionMicrophone");
    expect(signals).toHaveProperty("permissionNotifications");
    expect(signals).toHaveProperty("permissionGeolocation");
    expect(signals).toHaveProperty("plugins");
    expect(signals).toHaveProperty("mimeTypes");
  });

  it("returns a string for userAgent in jsdom", async () => {
    const signals = await collectNavigatorSignals();
    expect(signals.userAgent).toBeTypeOf("string");
  });
});
