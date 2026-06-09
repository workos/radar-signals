/**
 * Dynamic loader for the WorkOS Radar collectors script.
 *
 * Instead of bundling collectors into the React package, this module
 * loads them at runtime from the CDN. The script is loaded once and
 * the promise is cached for subsequent calls.
 */

const COLLECTORS_SCRIPT_URL = "https://js.workos.com/radar/v1/collectors.js";

/** Shape of a WorkOSRadar instance created by the collectors script. */
export interface RadarInstance {
  getToken(): Promise<string>;
  getTokenSync(): string;
  refresh(): Promise<string>;
  destroy(): void;
}

interface RadarConstructor {
  init(options: { clientId: string; apiUrl?: string }): RadarInstance;
}

interface WorkOSRadarGlobal {
  WorkOSRadar: RadarConstructor;
}

let scriptPromise: Promise<RadarConstructor> | null = null;

/**
 * Load the WorkOS Radar collectors script from the CDN.
 *
 * Returns a singleton promise that resolves with the `WorkOSRadar` constructor.
 * If the script tag is already present on the page (e.g. loaded manually),
 * resolves immediately without injecting a duplicate.
 */
export function loadCollectorsScript(): Promise<RadarConstructor> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<RadarConstructor>((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Radar collectors require a browser environment"));
      return;
    }

    // If the script was already loaded (e.g. via a manual <script> tag),
    // resolve immediately without injecting a duplicate.
    const existing = (window as unknown as { WorkOSRadar?: WorkOSRadarGlobal })
      .WorkOSRadar;
    if (existing?.WorkOSRadar) {
      resolve(existing.WorkOSRadar);
      return;
    }

    const script = document.createElement("script");
    script.src = COLLECTORS_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      const global = (
        window as unknown as { WorkOSRadar?: WorkOSRadarGlobal }
      ).WorkOSRadar;
      if (global?.WorkOSRadar) {
        resolve(global.WorkOSRadar);
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
