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
import type { RadarInitOptions } from "./types";

export type { RadarInitOptions } from "./types";

export class WorkOSRadar {
  private readonly options: RadarInitOptions;
  private signalsId: string;
  private completionPromise: Promise<void>;
  private resolveCompletion!: () => void;
  private destroyed = false;

  private constructor(options: RadarInitOptions) {
    this.options = options;
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
   */
  getTokenSync(): string {
    return this.signalsId;
  }

  /**
   * Cleanup: stops pending work.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
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
