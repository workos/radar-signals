/**
 * Puppeteer detection via querySelector stack-trace analysis.
 *
 * Patches Document.prototype.querySelector/querySelectorAll and
 * Element.prototype.querySelector/querySelectorAll to inspect call stacks.
 * Puppeteer's internal calls produce distinctive stack traces containing
 * "__puppeteer_utility_world__" or specific CDP evaluation patterns.
 *
 * Lifecycle:
 * 1. install() — patches prototypes, starts safety timeout
 * 2. getState() — snapshots current detection state
 * 3. restore() — restores original prototypes (idempotent)
 * 4. Safety net: auto-restores after 60s if restore() is never called
 */

const SAFETY_TIMEOUT_MS = 60_000;
const PUPPETEER_PATTERNS = [
  "__puppeteer_utility_world__",
  "pptr:",
  "ExecutionContext._evaluateInternal",
];

interface PuppeteerState {
  puppeteerDetected: boolean;
  puppeteerDocumentNotAvailable: boolean;
}

interface PuppeteerDetector {
  getState(): PuppeteerState;
  restore(): void;
}

export function installPuppeteerDetector(): PuppeteerDetector {
  let detected = false;
  let documentNotAvailable = false;
  let installed = true;

  // Check if document is available (can be false in some puppeteer contexts)
  try {
    if (typeof document === "undefined" || !document.querySelector) {
      documentNotAvailable = true;
      return {
        getState: () => ({
          puppeteerDetected: detected,
          puppeteerDocumentNotAvailable: documentNotAvailable,
        }),
        restore: () => {},
      };
    }
  } catch {
    documentNotAvailable = true;
    return {
      getState: () => ({
        puppeteerDetected: true,
        puppeteerDocumentNotAvailable: true,
      }),
      restore: () => {},
    };
  }

  const origDocQs = Document.prototype.querySelector;
  const origDocQsa = Document.prototype.querySelectorAll;
  const origElQs = Element.prototype.querySelector;
  const origElQsa = Element.prototype.querySelectorAll;

  function checkStack(): void {
    if (detected || !installed) return;
    try {
      const stack = new Error().stack || "";
      for (const pattern of PUPPETEER_PATTERNS) {
        if (stack.includes(pattern)) {
          detected = true;
          restore();
          return;
        }
      }
    } catch {
      // Ignore errors in stack inspection
    }
  }

  Document.prototype.querySelector = function (...args: [string]) {
    checkStack();
    return origDocQs.apply(this, args);
  };

  Document.prototype.querySelectorAll = function (...args: [string]) {
    checkStack();
    return origDocQsa.apply(this, args);
  };

  Element.prototype.querySelector = function (...args: [string]) {
    checkStack();
    return origElQs.apply(this, args);
  };

  Element.prototype.querySelectorAll = function (...args: [string]) {
    checkStack();
    return origElQsa.apply(this, args);
  };

  // Safety net: auto-restore after timeout
  const timer = setTimeout(() => restore(), SAFETY_TIMEOUT_MS);

  function restore(): void {
    if (!installed) return;
    installed = false;
    clearTimeout(timer);
    Document.prototype.querySelector = origDocQs;
    Document.prototype.querySelectorAll = origDocQsa;
    Element.prototype.querySelector = origElQs;
    Element.prototype.querySelectorAll = origElQsa;
  }

  return {
    getState: () => ({
      puppeteerDetected: detected,
      puppeteerDocumentNotAvailable: documentNotAvailable,
    }),
    restore,
  };
}
