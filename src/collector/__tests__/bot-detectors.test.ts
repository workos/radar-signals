import { describe, it, expect } from "vitest";
import { collectBotSignals } from "../bot-detectors";

describe("collectBotSignals", () => {
  it("returns false for all bot detectors in clean environment", () => {
    const signals = collectBotSignals();
    expect(signals.seleniumDetected).toBe(false);
    expect(signals.playwrightDetected).toBe(false);
    expect(signals.phantomDetected).toBe(false);
    expect(signals.nightmareDetected).toBe(false);
  });

  it("includes rangeErrorLength and evalStringLength", () => {
    const signals = collectBotSignals();
    expect(signals).toHaveProperty("rangeErrorLength");
    expect(signals).toHaveProperty("evalStringLength");
  });
});
