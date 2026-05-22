/**
 * Collect CSS media query preferences via matchMedia.
 */

import type { MediaPreferences } from "../types";

function matchMediaValue(query: string, values: string[]): string | null {
  try {
    for (const value of values) {
      if (window.matchMedia(`(${query}: ${value})`).matches) {
        return value;
      }
    }
    return "no-preference";
  } catch {
    return null;
  }
}

export function collectMediaPreferences(): MediaPreferences | null {
  try {
    return {
      prefersColorScheme: matchMediaValue("prefers-color-scheme", [
        "dark",
        "light",
      ]),
      prefersReducedMotion: matchMediaValue("prefers-reduced-motion", [
        "reduce",
      ]),
      prefersReducedTransparency: matchMediaValue(
        "prefers-reduced-transparency",
        ["reduce"],
      ),
      prefersContrast: matchMediaValue("prefers-contrast", [
        "more",
        "less",
        "custom",
      ]),
      forcedColors: matchMediaValue("forced-colors", ["active"]),
      invertedColors: matchMediaValue("inverted-colors", ["inverted"]),
      prefersReducedData: matchMediaValue("prefers-reduced-data", ["reduce"]),
      colorGamut: matchMediaValue("color-gamut", ["rec2020", "p3", "srgb"]),
    };
  } catch {
    return null;
  }
}
