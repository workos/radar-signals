/**
 * Dynamic loader for the WorkOS Radar collectors script.
 *
 * The CDN script handles signal collection and API submission on its own.
 * This module:
 *
 * 1. Sets `window.__WorkOSRadarConfig` so the script knows the clientId
 * 2. Injects the `<script>` tag (once)
 * 3. Resolves with a `RadarScriptAPI` wrapper once `signalsId` is populated
 */

import type { RadarInitOptions } from "./types";

const COLLECTORS_SCRIPT_URL = "https://js.workos.com/radar/v1/collectors.js";

/** Maximum time (ms) to wait for the collector to populate signalsId. */
const SIGNALS_TIMEOUT_MS = 10_000;

/** API surface exposed by the collectors script on `window.__WorkOSRadarCollector`. */
interface RadarCollectorAPI {
  collectSignals(): Promise<unknown>;
  signalsId: string;
}

/** Stable API surface returned to consumers of this module. */
export interface RadarScriptAPI {
  getToken(): string;
}

type WindowWithRadar = Window &
  typeof globalThis & {
    __WorkOSRadarCollector?: RadarCollectorAPI;
    __WorkOSRadarConfig?: RadarInitOptions;
  };

let scriptPromise: Promise<RadarScriptAPI> | null = null;

function wrapCollector(collector: RadarCollectorAPI): RadarScriptAPI {
  return {
    getToken: () => collector.signalsId,
  };
}

/**
 * Direct fallback: read `window.__WorkOSRadarCollector` and wrap it.
 * Useful when the promise-based flow loses the reference (e.g. StrictMode).
 */
export function getCollectorFromWindow(): RadarScriptAPI | null {
  if (typeof window === "undefined") return null;
  const collector = (window as WindowWithRadar).__WorkOSRadarCollector;
  if (!collector?.signalsId) return null;
  return wrapCollector(collector);
}

/**
 * Load the WorkOS Radar collectors script from the CDN.
 *
 * Sets `window.__WorkOSRadarConfig` with the provided `clientId` so the
 * script can read it on load, then injects the `<script>` tag. The script
 * self-initializes — it collects signals and posts them to the API. The
 * returned promise resolves with a `RadarScriptAPI` wrapper once `signalsId`
 * has been populated by the collector.
 *
 * The script is loaded once; subsequent calls return the cached promise
 * (but always update `window.__WorkOSRadarConfig`).
 */
export function loadCollectorsScript(
  config: RadarInitOptions,
): Promise<RadarScriptAPI> {
  if (typeof window !== "undefined") {
    (window as WindowWithRadar).__WorkOSRadarConfig = config;
  }

  if (scriptPromise) return scriptPromise;

  // SSR guard: reject without caching so subsequent calls can retry
  // once a browser environment is available.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Radar collectors require a browser environment"),
    );
  }

  scriptPromise = new Promise<RadarScriptAPI>((resolve, reject) => {
    // If the script was already loaded (e.g. via a manual <script> tag),
    // resolve immediately without injecting a duplicate.
    const existing = (window as WindowWithRadar).__WorkOSRadarCollector;
    if (existing?.signalsId) {
      resolve(wrapCollector(existing));
      return;
    }

    const script = document.createElement("script");
    script.src = COLLECTORS_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";

    // Fail-open timeout: if signalsId is never set, resolve with empty token.
    const timeout = setTimeout(() => {
      resolve({ getToken: () => "" });
    }, SIGNALS_TIMEOUT_MS);

    script.onload = () => {
      const collector = (window as WindowWithRadar).__WorkOSRadarCollector;
      if (!collector) {
        clearTimeout(timeout);
        scriptPromise = null;
        reject(
          new Error(
            "__WorkOSRadarCollector global not found after loading collectors script",
          ),
        );
        return;
      }

      // Fast path: signalsId is already populated (e.g. cached response).
      if (collector.signalsId) {
        clearTimeout(timeout);
        resolve(wrapCollector(collector));
        return;
      }

      // The collector sets signalsId asynchronously after collect+submit.
      // Intercept the assignment so we resolve exactly when it's ready.
      let current = collector.signalsId;
      Object.defineProperty(collector, "signalsId", {
        get: () => current,
        set(value: string) {
          current = value;
          if (value) {
            clearTimeout(timeout);
            // Restore as a normal data property.
            Object.defineProperty(collector, "signalsId", {
              value,
              writable: true,
              configurable: true,
              enumerable: true,
            });
            resolve(wrapCollector(collector));
          }
        },
        configurable: true,
        enumerable: true,
      });
    };

    script.onerror = () => {
      clearTimeout(timeout);
      scriptPromise = null;
      reject(
        new Error(
          `Failed to load Radar collectors from ${COLLECTORS_SCRIPT_URL}`,
        ),
      );
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
}
