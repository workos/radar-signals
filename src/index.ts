/**
 * @workos/radar-signals
 *
 * Thin SDK loader for WorkOS Radar.
 * Loads a CDN-hosted collection script at runtime, sends collected signals
 * to the WorkOS API, and provides a correlation token.
 *
 * Signal collection logic lives in a separate private package and is loaded
 * from a WorkOS CDN at runtime (not bundled here).
 */

import { ulid } from "ulidx";
import type { RadarInitOptions, Signals } from "./types";
import { beaconSignals } from "./api/client";

export type {
  RadarInitOptions,
  Signals,
  SignalsWorker,
  Screen,
  MinimalSurface,
  MediaPreferences,
} from "./types";

/** Current state of the Radar instance. */
type RadarState =
  | { phase: "collecting" }
  | { phase: "sending"; signals: Signals }
  | { phase: "ready"; signals: Signals }
  | { phase: "error"; signals: Signals | null };

export class WorkOSRadar {
  private readonly options: Required<Pick<RadarInitOptions, "clientId">> &
    Pick<RadarInitOptions, "apiUrl">;
  private signalsId: string;
  private state: RadarState = { phase: "collecting" };
  private completionPromise: Promise<void>;
  private resolveCompletion!: () => void;
  private destroyed = false;

  private constructor(options: RadarInitOptions) {
    this.options = { clientId: options.clientId, apiUrl: options.apiUrl };
    this.signalsId = ulid();

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
    // Only beacon if signals are collected but not yet sent
    // (e.g., navigation interrupts the in-flight POST).
    // Don't beacon in "ready" state — POST already succeeded.
    if (state.phase === "sending" || (state.phase === "error" && state.signals)) {
      beaconSignals({
        id: this.signalsId,
        signals: state.signals!,
        clientId: this.options.clientId,
        apiUrl: this.options.apiUrl,
      });
    }
    // In all cases return the token — fail-open
    return this.signalsId;
  }

  /**
   * Re-collect signals and get a new token.
   * Use for subsequent auth attempts on the same page.
   */
  async refresh(): Promise<string> {
    // Resolve any pending waiters from the previous cycle so they don't hang.
    this.resolveCompletion();
    this.signalsId = ulid();
    this.state = { phase: "collecting" };
    this.completionPromise = new Promise<void>((resolve) => {
      this.resolveCompletion = resolve;
    });
    await this.run();
    return this.signalsId;
  }

  /**
   * Cleanup: stops pending work.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    // Resolve any pending waiters
    this.resolveCompletion();
  }

  private async run(): Promise<void> {
    // Signal collection is handled by the CDN-hosted collectors script
    // (loaded via the React SDK's load-script module). The vanilla SDK
    // resolves immediately so callers aren't blocked.
    const resolve = this.resolveCompletion;
    resolve();
  }
}
