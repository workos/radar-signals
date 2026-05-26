/**
 * Puppeteer querySelector stack-trace trap.
 *
 * Patches Document.prototype.querySelector/querySelectorAll and
 * Element.prototype.querySelector/querySelectorAll to capture stack traces
 * and detect Puppeteer-specific patterns.
 *
 * Standalone lifecycle (no React dependency):
 *   1. setupPuppeteerDetector() — patches prototypes, starts safety timeout
 *   2. snapshot()               — returns current detection state
 *   3. destroy()                — restores original prototypes, clears singleton
 *   4. Safety net               — auto-restores prototypes after timeout (default 60s)
 */

import type { PuppeteerDetection } from "../types";

export type { PuppeteerDetection };

export interface PuppeteerDetectorAPI {
  snapshot: () => PuppeteerDetection;
  destroy: () => void;
}

type Label =
  | "document.querySelector"
  | "document.querySelectorAll"
  | "element.querySelector"
  | "element.querySelectorAll";

interface QSMatch {
  ts: number;
  label: Label;
  selector: string;
  stack: string;
  patterns: string[];
}

/** Stack-trace patterns that indicate Puppeteer automation. */
const PUPPETEER_STACK_PATTERNS: RegExp[] = [
  /\bpptr\b/i,
  /__puppeteer/i,
  /puppeteer(?:_| )evaluation(?:_| )script/i,
  /ExecutionContext\._evaluate/i,
  /FrameManager\./i,
];

const DEFAULT_SAFETY_TIMEOUT_MS = 60_000;

let singleton: PuppeteerDetectorAPI | undefined;

/**
 * Install the puppeteer querySelector trap.
 *
 * Returns a `PuppeteerDetectorAPI` handle with `snapshot()` to read detection
 * state and `destroy()` to restore original prototypes. The detector is a
 * singleton — repeated calls return the same instance.
 *
 * A safety timeout (default 60 s) automatically restores prototypes if
 * `destroy()` is never called.
 */
export function setupPuppeteerDetector(
  safetyTimeoutMs: number = DEFAULT_SAFETY_TIMEOUT_MS,
): PuppeteerDetectorAPI {
  if (singleton) {
    return singleton;
  }

  // SSR / non-browser guard
  if (
    typeof globalThis === "undefined" ||
    typeof globalThis.Document === "undefined" ||
    typeof globalThis.Element === "undefined"
  ) {
    singleton = {
      snapshot: () => ({ detected: false, documentNotAvailable: true }),
      destroy: () => {
        singleton = undefined;
      },
    };
    return singleton;
  }

  const matches: QSMatch[] = [];

  // Capture original prototypes before patching
  const origDocQS = Document.prototype.querySelector;
  const origDocQSA = Document.prototype.querySelectorAll;
  const origElemQS = Element.prototype.querySelector;
  const origElemQSA = Element.prototype.querySelectorAll;

  let _installed = false;
  let _safetyTimer: ReturnType<typeof setTimeout> | undefined;

  const restore = () => {
    if (!_installed) {
      return;
    }
    _installed = false;

    if (_safetyTimer !== undefined) {
      clearTimeout(_safetyTimer);
      _safetyTimer = undefined;
    }

    Object.defineProperty(Document.prototype, "querySelector", {
      value: origDocQS,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Document.prototype, "querySelectorAll", {
      value: origDocQSA,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Element.prototype, "querySelector", {
      value: origElemQS,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Element.prototype, "querySelectorAll", {
      value: origElemQSA,
      configurable: true,
      writable: true,
    });
  };

  const captureStack = (): string => {
    try {
      throw new Error("__qs_pptr_probe__");
    } catch (err) {
      return err instanceof Error && typeof err.stack === "string"
        ? err.stack
        : "";
    }
  };

  const makeWrapper = <This, R>(
    orig: (this: This, selector: string) => R,
    label: Label,
  ) =>
    function wrapped(this: This, selector: string): R {
      const stack = captureStack();
      const hits = PUPPETEER_STACK_PATTERNS.filter((rx) => rx.test(stack)).map(
        (rx) => rx.source,
      );
      if (hits.length > 0) {
        matches.push({
          ts: Date.now(),
          label,
          selector,
          stack,
          patterns: hits,
        });
        restore(); // auto-restore on first detection
      }
      return orig.call(this, selector);
    };

  // Install patches
  try {
    Object.defineProperty(Document.prototype, "querySelector", {
      value: makeWrapper<Document, Element | null>(
        origDocQS,
        "document.querySelector",
      ),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Document.prototype, "querySelectorAll", {
      value: makeWrapper<Document, NodeListOf<Element>>(
        origDocQSA,
        "document.querySelectorAll",
      ),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Element.prototype, "querySelector", {
      value: makeWrapper<Element, Element | null>(
        origElemQS,
        "element.querySelector",
      ),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(Element.prototype, "querySelectorAll", {
      value: makeWrapper<Element, NodeListOf<Element>>(
        origElemQSA,
        "element.querySelectorAll",
      ),
      configurable: true,
      writable: true,
    });
    _installed = true;
  } catch {
    // Silently fail if prototypes are frozen or non-configurable
  }

  // Safety timeout: fully tear down if destroy() is never called.
  // Uses an inline callback (rather than referencing `destroy`) because
  // `destroy` is defined after this point; the callback executes long after
  // the function returns, so the reference is safe at runtime, but an inline
  // form avoids any confusion about temporal dead zones.
  if (_installed && safetyTimeoutMs > 0) {
    _safetyTimer = setTimeout(() => {
      restore();
      singleton = undefined;
    }, safetyTimeoutMs);
  }

  const snapshot = (): PuppeteerDetection => ({
    detected: matches.length > 0,
    documentNotAvailable: false,
  });

  const destroy = () => {
    restore();
    singleton = undefined;
  };

  singleton = { snapshot, destroy };
  return singleton;
}

/**
 * Visible for testing only. Resets the singleton so a fresh detector can be
 * installed in the next call to `setupPuppeteerDetector()`.
 * @internal
 */
export function _resetDetectorSingleton(): void {
  if (singleton) {
    singleton.destroy();
  }
}
