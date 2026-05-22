import { describe, it, expect } from "vitest";
import { collectMediaPreferences } from "../media-preferences";

describe("collectMediaPreferences", () => {
  it("returns an object with all expected fields", () => {
    const prefs = collectMediaPreferences();
    expect(prefs).not.toBeNull();
    expect(prefs).toHaveProperty("prefersColorScheme");
    expect(prefs).toHaveProperty("prefersReducedMotion");
    expect(prefs).toHaveProperty("prefersReducedTransparency");
    expect(prefs).toHaveProperty("prefersContrast");
    expect(prefs).toHaveProperty("forcedColors");
    expect(prefs).toHaveProperty("invertedColors");
    expect(prefs).toHaveProperty("prefersReducedData");
    expect(prefs).toHaveProperty("colorGamut");
  });
});
