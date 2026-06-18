import { useRef, useEffect, useCallback, useState } from "react";
import type { RadarInitOptions } from "../types";
import {
  loadCollectorsScript,
  getCollectorFromWindow,
  type RadarScriptAPI,
} from "../load-script";

/**
 * Standalone hook (no context needed) for signal collection.
 * Loads the collectors script from the CDN — the script self-initializes,
 * collects signals, and posts them to the API on its own.
 */
export function useRadarSignals(options: RadarInitOptions) {
  const radarRef = useRef<RadarScriptAPI | null>(null);
  const initRef = useRef<Promise<void> | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  // Eagerly start loading during render.
  if (initRef.current === null) {
    initRef.current = loadCollectorsScript(options)
      .then((api) => {
        radarRef.current = api;
        setTokenReady(api.getToken() !== "");
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });
  }

  useEffect(() => {
    // Re-initialize after cleanup (handles StrictMode remount and
    // clientId changes — both null the refs before this runs).
    if (initRef.current === null) {
      initRef.current = loadCollectorsScript(options)
        .then((api) => {
          radarRef.current = api;
          setTokenReady(api.getToken() !== "");
        })
        .catch(() => {});
    }

    return () => {
      radarRef.current = null;
      initRef.current = null;
      setTokenReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.clientId, options.apiUrl]);

  const getToken = useCallback(async () => {
    await initRef.current;
    const api = radarRef.current ?? getCollectorFromWindow();
    if (!api) return "";
    const token = api.getToken();
    if (token) setTokenReady(true);
    return token;
  }, []);

  return { getToken, tokenReady };
}
