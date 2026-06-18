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

import type { RadarInitOptions } from "./types";
import {
  loadCollectorsScript,
  getCollectorFromWindow,
  type RadarScriptAPI,
} from "./load-script";

export type { RadarInitOptions } from "./types";

export class WorkOSRadar {
  private scriptAPI: RadarScriptAPI | null = null;
  private initPromise: Promise<void>;

  /** Whether a real token is available from the collector. */
  tokenReady: boolean = false;

  private constructor(options: RadarInitOptions) {
    this.initPromise = loadCollectorsScript(options)
      .then((api) => {
        this.scriptAPI = api;
        this.tokenReady = api.getToken() !== "";
      })
      .catch(() => {
        // Fail-open: if the CDN script can't load, getToken returns ""
      });
  }

  /**
   * Initialize Radar signal collection.
   * Loads the CDN collectors script and begins collecting signals.
   */
  static init(options: RadarInitOptions): WorkOSRadar {
    return new WorkOSRadar(options);
  }

  /**
   * Get the correlation token to pass with an auth API call.
   * If signal collection is still in-flight, awaits completion.
   * Fail-open: returns "" if the script failed to load or timed out.
   */
  async getToken(): Promise<string> {
    await this.initPromise;
    const api = this.scriptAPI ?? getCollectorFromWindow();
    if (!api) return "";
    const token = api.getToken();
    if (token && !this.tokenReady) {
      this.tokenReady = true;
    }
    return token;
  }
}
