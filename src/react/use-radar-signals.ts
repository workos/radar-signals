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

  useEffect(() => {
    let cancelled = false;

    initRef.current = loadCollectorsScript(options)
      .then((api) => {
        if (cancelled) return;
        radarRef.current = api;
        setTokenReady(api.getToken() !== "");
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });

    return () => {
      cancelled = true;
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
    if (token) {
      setTokenReady(true);
      return token;
    }
    // Primary API returned empty — try the window fallback in case
    // the collector finished outside the loader flow.
    const fallback = getCollectorFromWindow();
    const fallbackToken = fallback?.getToken() ?? "";
    if (fallbackToken) setTokenReady(true);
    return fallbackToken;
  }, []);

  return { getToken, tokenReady };
}
