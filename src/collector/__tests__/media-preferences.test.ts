import { describe, it, expect } from "vitest";
import { collectMediaPreferences } from "../media-preferences";

describe("collectMediaPreferences", () => {
  it("returns an object with all expected fields", () => {
    const prefs = collectMediaPreferences();
    expect(prefs).toHaveProperty("colorScheme");
    expect(prefs).toHaveProperty("reducedMotion");
    expect(prefs).toHaveProperty("reducedTransparency");
    expect(prefs).toHaveProperty("contrast");
    expect(prefs).toHaveProperty("colorGamut");
    expect(prefs).toHaveProperty("hdr");
    expect(prefs).toHaveProperty("forcedColors");
    expect(prefs).toHaveProperty("invertedColors");
  });
});
