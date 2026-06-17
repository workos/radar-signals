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
} from "./react/load-script";

export type { RadarInitOptions } from "./types";

export class WorkOSRadar {
  private scriptAPI: RadarScriptAPI | null = null;
  private initPromise: Promise<void>;

  private constructor(options: RadarInitOptions) {
    this.initPromise = loadCollectorsScript(options)
      .then((api) => {
        this.scriptAPI = api;
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
   * If the CDN script is still loading, awaits completion.
   * Fail-open: returns "" if the script failed to load.
   */
  async getToken(): Promise<string> {
    await this.initPromise;
    if (!this.scriptAPI) return "";
    return this.scriptAPI.getToken();
  }

  /**
   * Get the correlation token synchronously.
   * For redirect/OAuth flows where you're about to navigate away.
   */
  getTokenSync(): string {
    return (
      this.scriptAPI?.getTokenSync() ??
      getCollectorFromWindow()?.getTokenSync() ??
      ""
    );
  }
}
