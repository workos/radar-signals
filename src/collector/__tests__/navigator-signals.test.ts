import { describe, it, expect } from "vitest";
import { collectNavigatorSignals } from "../navigator-signals";

describe("collectNavigatorSignals", () => {
  it("returns an object with all expected navigator signal fields", async () => {
    const signals = await collectNavigatorSignals();

    expect(signals).toHaveProperty("timezone");
    expect(signals).toHaveProperty("language");
    expect(signals).toHaveProperty("hardwareConcurrency");
    expect(signals).toHaveProperty("webdriver");
    expect(signals).toHaveProperty("userAgent");
    expect(signals).toHaveProperty("appVersion");
    expect(signals).toHaveProperty("platform");
    expect(signals).toHaveProperty("screen");
    expect(signals).toHaveProperty("maxTouchPoints");
    expect(signals).toHaveProperty("devicePixelRatio");
    expect(signals).toHaveProperty("documentHidden");
    expect(signals).toHaveProperty("documentVisibilityState");
    expect(signals).toHaveProperty("pluginsLength");
    expect(signals).toHaveProperty("mimeTypesCount");
  });

  it("returns a nested screen object", async () => {
    const signals = await collectNavigatorSignals();
    expect(signals.screen).toHaveProperty("width");
    expect(signals.screen).toHaveProperty("height");
  });

  it("returns a string for userAgent in jsdom", async () => {
    const signals = await collectNavigatorSignals();
    expect(signals.userAgent).toBeTypeOf("string");
  });
});
