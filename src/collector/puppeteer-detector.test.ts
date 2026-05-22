import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setupPuppeteerDetector,
  _resetDetectorSingleton,
  type PuppeteerDetectorAPI,
} from "./puppeteer-detector";

describe("setupPuppeteerDetector", () => {
  let detector: PuppeteerDetectorAPI;

  beforeEach(() => {
    _resetDetectorSingleton();
    vi.useFakeTimers();
  });

  afterEach(() => {
    _resetDetectorSingleton();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Installation & prototype patching
  // ---------------------------------------------------------------------------

  describe("installation", () => {
    it("patches Document.prototype.querySelector", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector();
      expect(Document.prototype.querySelector).not.toBe(origQS);
      detector.destroy();
    });

    it("patches Document.prototype.querySelectorAll", () => {
      const origQSA = Document.prototype.querySelectorAll;
      detector = setupPuppeteerDetector();
      expect(Document.prototype.querySelectorAll).not.toBe(origQSA);
      detector.destroy();
    });

    it("patches Element.prototype.querySelector", () => {
      const origQS = Element.prototype.querySelector;
      detector = setupPuppeteerDetector();
      expect(Element.prototype.querySelector).not.toBe(origQS);
      detector.destroy();
    });

    it("patches Element.prototype.querySelectorAll", () => {
      const origQSA = Element.prototype.querySelectorAll;
      detector = setupPuppeteerDetector();
      expect(Element.prototype.querySelectorAll).not.toBe(origQSA);
      detector.destroy();
    });

    it("patched querySelector still returns correct DOM results", () => {
      detector = setupPuppeteerDetector();
      const el = document.querySelector("body");
      expect(el).toBe(document.body);
      detector.destroy();
    });

    it("patched querySelectorAll still returns correct DOM results", () => {
      detector = setupPuppeteerDetector();
      const nodes = document.querySelectorAll("head, body");
      expect(nodes.length).toBe(2);
      detector.destroy();
    });

    it("patched Element.querySelector still works", () => {
      detector = setupPuppeteerDetector();
      const div = document.createElement("div");
      const span = document.createElement("span");
      div.appendChild(span);
      expect(div.querySelector("span")).toBe(span);
      detector.destroy();
    });

    it("patched Element.querySelectorAll still works", () => {
      detector = setupPuppeteerDetector();
      const div = document.createElement("div");
      div.innerHTML = "<span></span><span></span>";
      expect(div.querySelectorAll("span").length).toBe(2);
      detector.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Snapshot (no detection)
  // ---------------------------------------------------------------------------

  describe("snapshot", () => {
    it("reports detected=false initially", () => {
      detector = setupPuppeteerDetector();
      const state = detector.snapshot();
      expect(state.detected).toBe(false);
      expect(state.documentNotAvailable).toBe(false);
      detector.destroy();
    });

    it("remains detected=false after normal querySelector calls", () => {
      detector = setupPuppeteerDetector();
      document.querySelector("body");
      document.querySelectorAll("div");
      const state = detector.snapshot();
      expect(state.detected).toBe(false);
      detector.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Puppeteer detection via stack-trace matching
  // ---------------------------------------------------------------------------

  describe("detection", () => {
    /**
     * Invoke querySelector from inside a function whose name contains a
     * Puppeteer-like token. The thrown-and-caught Error inside the wrapper
     * will include the caller's name in the stack trace, which the detector
     * matches against its regex patterns.
     *
     * Note: Some patterns (ExecutionContext._evaluate, FrameManager.) are
     * designed to match Puppeteer's internal module paths in real stack
     * traces. These can't be naturally reproduced in a jsdom test, so they
     * are verified via direct regex assertions below.
     */

    it("detects __puppeteer in the call stack", () => {
      detector = setupPuppeteerDetector();

      // The function name "__puppeteer_evaluation_script" appears in the stack
      // and matches the /__puppeteer/i pattern.
      const __puppeteer_evaluation_script = () => {
        document.querySelector("div");
      };
      __puppeteer_evaluation_script();

      expect(detector.snapshot().detected).toBe(true);
    });

    it("detects pptr as a whole word in the call stack", () => {
      detector = setupPuppeteerDetector();

      // A bare function named "pptr" appears in the stack as "at pptr (...)"
      // where spaces provide word boundaries for the /\bpptr\b/ pattern.
      function pptr() {
        document.querySelector("div");
      }
      pptr();

      expect(detector.snapshot().detected).toBe(true);
    });

    it("auto-restores prototypes on first detection", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector();

      // Trigger detection
      const __puppeteer_evaluation_script = () => {
        document.querySelector("div");
      };
      __puppeteer_evaluation_script();

      // Prototypes should be restored
      expect(Document.prototype.querySelector).toBe(origQS);
    });

    it("detection via Element.prototype.querySelector works", () => {
      detector = setupPuppeteerDetector();
      const div = document.createElement("div");
      div.innerHTML = "<span></span>";

      const __puppeteer_evaluation_script = () => {
        div.querySelector("span");
      };
      __puppeteer_evaluation_script();

      expect(detector.snapshot().detected).toBe(true);
    });

    it("detection via querySelectorAll works", () => {
      detector = setupPuppeteerDetector();

      const __puppeteer_evaluation_script = () => {
        document.querySelectorAll("div");
      };
      __puppeteer_evaluation_script();

      expect(detector.snapshot().detected).toBe(true);
    });

    it("detection via Element.prototype.querySelectorAll works", () => {
      detector = setupPuppeteerDetector();
      const div = document.createElement("div");
      div.innerHTML = "<span></span><span></span>";

      const __puppeteer_evaluation_script = () => {
        div.querySelectorAll("span");
      };
      __puppeteer_evaluation_script();

      expect(detector.snapshot().detected).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Stack-trace regex patterns (unit-level verification)
  // ---------------------------------------------------------------------------

  describe("stack-trace patterns", () => {
    /**
     * These patterns match Puppeteer's internal stack frames that appear in
     * real browser environments. We verify the regexes directly against
     * representative stack-frame strings.
     */

    const patterns = [
      /\bpptr\b/i,
      /__puppeteer/i,
      /puppeteer(?:_| )evaluation(?:_| )script/i,
      /ExecutionContext\._evaluate/i,
      /FrameManager\./i,
    ];

    it("matches 'pptr' as a whole word", () => {
      expect(patterns[0].test("at pptr.evaluate (pptr/lib/Page.js:42:5)")).toBe(
        true,
      );
      expect(
        patterns[0].test("at Object.pptr (node_modules/pptr-core/index.js:1)"),
      ).toBe(true);
      // Should NOT match substrings where pptr is part of a larger word char sequence
      expect(patterns[0].test("at foopptrbar (test.js:1)")).toBe(false);
    });

    it("matches __puppeteer prefix", () => {
      expect(
        patterns[1].test(
          "at __puppeteer_evaluation_script__:1:1",
        ),
      ).toBe(true);
      expect(
        patterns[1].test("at __puppeteer_utility_world_eval:3:14"),
      ).toBe(true);
    });

    it("matches puppeteer_evaluation_script and puppeteer evaluation script", () => {
      expect(
        patterns[2].test("puppeteer_evaluation_script"),
      ).toBe(true);
      expect(
        patterns[2].test("puppeteer evaluation script"),
      ).toBe(true);
    });

    it("matches ExecutionContext._evaluate", () => {
      expect(
        patterns[3].test(
          "at ExecutionContext._evaluate (node_modules/puppeteer-core/lib/cjs/ExecutionContext.js:121:19)",
        ),
      ).toBe(true);
    });

    it("matches FrameManager.", () => {
      expect(
        patterns[4].test(
          "at FrameManager.navigateFrame (node_modules/puppeteer-core/lib/cjs/FrameManager.js:92:21)",
        ),
      ).toBe(true);
    });

    it("does not match normal application stack frames", () => {
      const normalFrame =
        "at HTMLDocument.querySelector (document.js:1:1)\n" +
        "at handleClick (app.js:42:5)\n" +
        "at Object.dispatch (react-dom.js:100:3)";

      for (const pattern of patterns) {
        expect(pattern.test(normalFrame)).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------

  describe("destroy", () => {
    it("restores Document.prototype.querySelector", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector();
      expect(Document.prototype.querySelector).not.toBe(origQS);

      detector.destroy();
      expect(Document.prototype.querySelector).toBe(origQS);
    });

    it("restores Document.prototype.querySelectorAll", () => {
      const origQSA = Document.prototype.querySelectorAll;
      detector = setupPuppeteerDetector();
      detector.destroy();
      expect(Document.prototype.querySelectorAll).toBe(origQSA);
    });

    it("restores Element.prototype.querySelector", () => {
      const origQS = Element.prototype.querySelector;
      detector = setupPuppeteerDetector();
      detector.destroy();
      expect(Element.prototype.querySelector).toBe(origQS);
    });

    it("restores Element.prototype.querySelectorAll", () => {
      const origQSA = Element.prototype.querySelectorAll;
      detector = setupPuppeteerDetector();
      detector.destroy();
      expect(Element.prototype.querySelectorAll).toBe(origQSA);
    });

    it("is idempotent — multiple calls do not throw", () => {
      detector = setupPuppeteerDetector();
      expect(() => {
        detector.destroy();
        detector.destroy();
        detector.destroy();
      }).not.toThrow();
    });

    it("clears the singleton so a new detector can be installed", () => {
      const detector1 = setupPuppeteerDetector();
      detector1.destroy();

      const detector2 = setupPuppeteerDetector();
      expect(detector2).not.toBe(detector1);
      detector2.destroy();
    });

    it("preserves detection state after destroy", () => {
      detector = setupPuppeteerDetector();

      const __puppeteer_evaluation_script = () => {
        document.querySelector("div");
      };
      __puppeteer_evaluation_script();

      detector.destroy();
      // snapshot still reflects what was detected before destroy
      expect(detector.snapshot().detected).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Safety timeout
  // ---------------------------------------------------------------------------

  describe("safety timeout", () => {
    it("auto-restores prototypes after the safety timeout", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector(5_000);
      expect(Document.prototype.querySelector).not.toBe(origQS);

      vi.advanceTimersByTime(5_000);
      expect(Document.prototype.querySelector).toBe(origQS);
    });

    it("does not auto-restore before timeout elapses", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector(10_000);

      vi.advanceTimersByTime(9_999);
      expect(Document.prototype.querySelector).not.toBe(origQS);
      detector.destroy();
    });

    it("clears safety timer when destroy() is called before timeout", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector(10_000);
      detector.destroy();

      // Advance past the original timeout — should NOT throw or re-patch
      expect(Document.prototype.querySelector).toBe(origQS);
      vi.advanceTimersByTime(20_000);
      expect(Document.prototype.querySelector).toBe(origQS);
    });

    it("clears safety timer when auto-restore triggers on detection", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector(60_000);

      // Trigger detection (which calls restore and clears timer)
      const __puppeteer_evaluation_script = () => {
        document.querySelector("div");
      };
      __puppeteer_evaluation_script();

      expect(Document.prototype.querySelector).toBe(origQS);

      // Advance past timeout — should be a no-op since timer was cleared
      vi.advanceTimersByTime(120_000);
      expect(Document.prototype.querySelector).toBe(origQS);
    });

    it("disables safety timeout when safetyTimeoutMs is 0", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector(0);
      expect(Document.prototype.querySelector).not.toBe(origQS);

      vi.advanceTimersByTime(120_000);
      // Still patched because there's no safety timer
      expect(Document.prototype.querySelector).not.toBe(origQS);
      detector.destroy();
    });

    it("uses 60s default timeout", () => {
      const origQS = Document.prototype.querySelector;
      detector = setupPuppeteerDetector();

      vi.advanceTimersByTime(59_999);
      expect(Document.prototype.querySelector).not.toBe(origQS);

      vi.advanceTimersByTime(1);
      expect(Document.prototype.querySelector).toBe(origQS);
    });
  });

  // ---------------------------------------------------------------------------
  // Singleton behavior
  // ---------------------------------------------------------------------------

  describe("singleton", () => {
    it("returns the same instance on repeated calls", () => {
      const a = setupPuppeteerDetector();
      const b = setupPuppeteerDetector();
      expect(a).toBe(b);
      a.destroy();
    });

    it("shares detection state across handles", () => {
      const a = setupPuppeteerDetector();
      const b = setupPuppeteerDetector();

      // Trigger detection
      const __puppeteer_evaluation_script = () => {
        document.querySelector("div");
      };
      __puppeteer_evaluation_script();

      expect(a.snapshot().detected).toBe(true);
      expect(b.snapshot().detected).toBe(true);
      a.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // _resetDetectorSingleton
  // ---------------------------------------------------------------------------

  describe("_resetDetectorSingleton", () => {
    it("restores prototypes and allows a fresh detector", () => {
      const origQS = Document.prototype.querySelector;
      setupPuppeteerDetector();
      expect(Document.prototype.querySelector).not.toBe(origQS);

      _resetDetectorSingleton();
      expect(Document.prototype.querySelector).toBe(origQS);

      // Can install again
      const fresh = setupPuppeteerDetector();
      expect(Document.prototype.querySelector).not.toBe(origQS);
      fresh.destroy();
    });
  });
});
