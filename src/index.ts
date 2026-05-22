/**
 * @workos/radar-signals
 *
 * Browser signals collector for WorkOS Radar.
 * Collects fingerprinting and automation detection signals,
 * sends them to the WorkOS API, and provides a correlation token.
 */

import { ulid } from "ulidx";
import type { RadarInitOptions, Signals } from "./types";
import { collectAllSignals } from "./collector/index";
import { installPuppeteerDetector } from "./collector/puppeteer-detector";
import { runWebGLWorker } from "./worker/inline-worker";
import { postSignals, beaconSignals } from "./api/client";

export type { RadarInitOptions, Signals, RadarSignals, HashCount, MediaPreferences } from "./types";

/** Current state of the Radar instance. */
type RadarState =
  | { phase: "collecting" }
  | { phase: "sending" }
  | { phase: "ready"; signals: Signals }
  | { phase: "error"; signals: Signals | null };

export class WorkOSRadar {
  private readonly options: Required<Pick<RadarInitOptions, "clientId">> &
    Pick<RadarInitOptions, "apiUrl">;
  private signalsId: string;
  private state: RadarState = { phase: "collecting" };
  private completionPromise: Promise<void>;
  private resolveCompletion!: () => void;
  private puppeteerDetector: ReturnType<typeof installPuppeteerDetector>;
  private destroyed = false;

  private constructor(options: RadarInitOptions) {
    this.options = { clientId: options.clientId, apiUrl: options.apiUrl };
    this.signalsId = ulid();
    this.puppeteerDetector = installPuppeteerDetector();

    this.completionPromise = new Promise<void>((resolve) => {
      this.resolveCompletion = resolve;
    });

    this.run();
  }

  /**
   * Initialize Radar signal collection.
   * Immediately starts collecting signals and sending them to WorkOS.
   */
  static init(options: RadarInitOptions): WorkOSRadar {
    return new WorkOSRadar(options);
  }

  /**
   * Get the correlation token to pass with an auth API call.
   * If collection is still in-flight, awaits completion.
   * Fail-open: returns a token even if the API POST failed.
   */
  async getToken(): Promise<string> {
    await this.completionPromise;
    return this.signalsId;
  }

  /**
   * Get the correlation token synchronously.
   * For redirect/OAuth flows where you're about to navigate away.
   * If signals haven't been sent yet, flushes via sendBeacon.
   */
  getTokenSync(): string {
    const { state } = this;
    if (state.phase === "ready" || state.phase === "error") {
      // Already sent (or failed) — beacon the signals if available
      if (state.signals) {
        beaconSignals({
          id: this.signalsId,
          signals: state.signals,
          clientId: this.options.clientId,
          apiUrl: this.options.apiUrl,
        });
      }
    }
    // In all cases return the token — fail-open
    return this.signalsId;
  }

  /**
   * Re-collect signals and get a new token.
   * Use for subsequent auth attempts on the same page.
   */
  async refresh(): Promise<string> {
    this.signalsId = ulid();
    this.state = { phase: "collecting" };
    this.completionPromise = new Promise<void>((resolve) => {
      this.resolveCompletion = resolve;
    });
    await this.run();
    return this.signalsId;
  }

  /**
   * Cleanup: restores patched DOM prototypes and stops pending work.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.puppeteerDetector.restore();
    // Resolve any pending waiters
    this.resolveCompletion();
  }

  private async run(): Promise<void> {
    try {
      // Collect signals (main thread + worker in parallel)
      const [signals, workerResult] = await Promise.all([
        collectAllSignals(this.puppeteerDetector.getState()),
        runWebGLWorker(),
      ]);

      // Merge worker WebGL results (worker results take precedence if available)
      if (workerResult.renderer) signals.webGLRenderer = workerResult.renderer;
      if (workerResult.vendor) signals.webGLVendor = workerResult.vendor;
      if (workerResult.paramsHash)
        signals.webGLParamsHash = workerResult.paramsHash;

      if (this.destroyed) return;

      this.state = { phase: "sending" };

      // POST to API (fail-open)
      await postSignals({
        id: this.signalsId,
        signals,
        clientId: this.options.clientId,
        apiUrl: this.options.apiUrl,
      });

      this.state = { phase: "ready", signals };
    } catch {
      this.state = { phase: "error", signals: null };
    } finally {
      this.resolveCompletion();
    }
  }
}
