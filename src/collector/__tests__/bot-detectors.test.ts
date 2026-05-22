import { describe, it, expect, afterEach } from "vitest";
import { collectBotSignals } from "../bot-detectors";

describe("collectBotSignals", () => {
  afterEach(() => {
    // Clean up any globals we may have set
    const w = globalThis as Record<string, unknown>;
    delete w._selenium;
    delete w.__playwright;
    delete w._phantom;
    delete w.__nightmare;
  });

  it("returns false for all detectors in clean environment", () => {
    const signals = collectBotSignals();
    expect(signals.seleniumDetected).toBe(false);
    expect(signals.playwrightDetected).toBe(false);
    expect(signals.phantomDetected).toBe(false);
    expect(signals.nightmareDetected).toBe(false);
  });

  it("detects selenium when global marker is present", () => {
    (globalThis as Record<string, unknown>)._selenium = true;
    const signals = collectBotSignals();
    expect(signals.seleniumDetected).toBe(true);
  });

  it("detects playwright when global marker is present", () => {
    (globalThis as Record<string, unknown>).__playwright = true;
    const signals = collectBotSignals();
    expect(signals.playwrightDetected).toBe(true);
  });

  it("detects phantom when global marker is present", () => {
    (globalThis as Record<string, unknown>)._phantom = true;
    const signals = collectBotSignals();
    expect(signals.phantomDetected).toBe(true);
  });

  it("detects nightmare when global marker is present", () => {
    (globalThis as Record<string, unknown>).__nightmare = true;
    const signals = collectBotSignals();
    expect(signals.nightmareDetected).toBe(true);
  });
});
