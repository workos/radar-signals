/**
 * Detects common browser automation frameworks.
 */

export type BotSignals = {
  seleniumDetected: boolean;
  playwrightDetected: boolean;
  phantomDetected: boolean;
  nightmareDetected: boolean;
  rangeErrorLength?: number;
  evalStringLength?: number;
};

export function collectBotSignals(): BotSignals {
  // oxlint-disable-next-line typescript/no-for-in-array -- intentional: enumerating window/document properties for Selenium detection
  let seleniumDetected = false;
  for (const key in window) {
    if (key.startsWith('$cdc_') || key.startsWith('cdc_')) {
      seleniumDetected = true;
      break;
    }
  }

  if (!seleniumDetected) {
    for (const key in document) {
      if (key.startsWith('$cdc_') || key.startsWith('cdc_')) {
        seleniumDetected = true;
        break;
      }
    }
  }

  // The length of the rangeError message can vary based on the browser.
  const rangeErrorLength = (() => {
    try {
      let msgLen = 0;
      try {
        new Array(-1);
        return 0;
      } catch (err) {
        const m =
          err && err instanceof Error && typeof err.message === 'string'
            ? err.message
            : '';
        msgLen = m.length;
      }

      const fnStr = Function.prototype.toString.call(Array);
      const funcName = typeof Array.name === 'string' ? Array.name : '';

      const extraLen = funcName
        ? fnStr.split(funcName).join('').length
        : fnStr.length;

      return msgLen + extraLen;
    } catch {
      return undefined;
    }
  })();

  // The length of the eval string can vary based on the browser.
  const evalStringLength = (() => {
    try {
      const somethingElse = window;
      // eslint-disable-next-line no-eval -- intentional fingerprint differentiator
      return somethingElse.eval.toString().length;
    } catch {
      return undefined;
    }
  })();

  return {
    seleniumDetected,
    playwrightDetected:
      '__playwright__binding__' in window || '__pwInitScripts' in window,
    phantomDetected:
      '_phantom' in window ||
      '__phantom' in window ||
      'callPhantom' in window ||
      '__phantomas' in window,
    nightmareDetected: '__nightmare' in window,
    rangeErrorLength,
    evalStringLength,
  };
}
