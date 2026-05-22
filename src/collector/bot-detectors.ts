/**
 * Detect common automation frameworks by checking for their browser-side
 * markers (global variables, prototype modifications, etc.).
 */

interface BotSignals {
  seleniumDetected: boolean;
  playwrightDetected: boolean;
  phantomDetected: boolean;
  nightmareDetected: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = globalThis as any;

function detectSelenium(): boolean {
  try {
    return !!(
      w._selenium ||
      w.__selenium_evaluate ||
      w.__selenium_unwrapped ||
      w.__webdriver_evaluate ||
      w.__driver_evaluate ||
      w.__webdriver_unwrapped ||
      w.__driver_unwrapped ||
      w.__fxdriver_evaluate ||
      w.__fxdriver_unwrapped ||
      w.calledSelenium ||
      w._Selenium_IDE_Recorder ||
      document.documentElement.getAttribute("selenium") ||
      document.documentElement.getAttribute("webdriver") ||
      document.documentElement.getAttribute("driver")
    );
  } catch {
    return false;
  }
}

function detectPlaywright(): boolean {
  try {
    return !!(w.__playwright || w._playwright);
  } catch {
    return false;
  }
}

function detectPhantom(): boolean {
  try {
    return !!(w._phantom || w.__phantomas || w.callPhantom);
  } catch {
    return false;
  }
}

function detectNightmare(): boolean {
  try {
    return !!(w.__nightmare);
  } catch {
    return false;
  }
}

export function collectBotSignals(): BotSignals {
  return {
    seleniumDetected: detectSelenium(),
    playwrightDetected: detectPlaywright(),
    phantomDetected: detectPhantom(),
    nightmareDetected: detectNightmare(),
  };
}
