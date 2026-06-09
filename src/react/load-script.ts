/**
 * Dynamic loader for the WorkOS Radar collectors script.
 *
 * The React SDK is a thin wrapper — the CDN script handles signal
 * collection and API submission on its own. This module:
 *
 * 1. Sets `window.__WorkOSRadarConfig` so the script knows the clientId
 * 2. Injects the `<script>` tag (once)
 * 3. Resolves with the `window.WorkOSRadar` API for token retrieval
 */

const COLLECTORS_SCRIPT_URL = "https://js.workos.com/radar/v1/collectors.js";

/** API surface exposed by the collectors script on `window.WorkOSRadar`. */
export interface RadarScriptAPI {
  getToken(): Promise<string>;
  getTokenSync(): string;
}

interface WorkOSRadarConfig {
  clientId: string;
}

type WindowWithRadar = Window &
  typeof globalThis & {
    WorkOSRadar?: RadarScriptAPI;
    __WorkOSRadarConfig?: WorkOSRadarConfig;
  };

let scriptPromise: Promise<RadarScriptAPI> | null = null;

/**
 * Load the WorkOS Radar collectors script from the CDN.
 *
 * Sets `window.__WorkOSRadarConfig` with the provided `clientId` so the
 * script can read it on load, then injects the `<script>` tag. The script
 * self-initializes — it collects signals and posts them to the API. The
 * returned promise resolves with the token-retrieval API from `window.WorkOSRadar`.
 *
 * The script is loaded once; subsequent calls return the cached promise
 * (but always update `window.__WorkOSRadarConfig`).
 */
export function loadCollectorsScript(config: {
  clientId: string;
}): Promise<RadarScriptAPI> {
  // Always update config so the script sees the latest clientId.
  if (typeof window !== "undefined") {
    (window as WindowWithRadar).__WorkOSRadarConfig = {
      clientId: config.clientId,
    };
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<RadarScriptAPI>((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Radar collectors require a browser environment"));
      return;
    }

    // If the script was already loaded (e.g. via a manual <script> tag),
    // resolve immediately without injecting a duplicate.
    const existing = (window as WindowWithRadar).WorkOSRadar;
    if (existing?.getToken) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = COLLECTORS_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      const api = (window as WindowWithRadar).WorkOSRadar;
      if (api?.getToken) {
        resolve(api);
      } else {
        scriptPromise = null;
        reject(
          new Error(
            "WorkOSRadar global not found after loading collectors script",
          ),
        );
      }
    };

    script.onerror = () => {
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
