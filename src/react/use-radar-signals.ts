import { useRef, useEffect, useCallback } from "react";
import type { RadarInitOptions } from "../types";
import { loadCollectorsScript, type RadarScriptAPI } from "./load-script";

/**
 * Standalone hook (no context needed) for signal collection.
 * Loads the collectors script from the CDN — the script self-initializes,
 * collects signals, and posts them to the API on its own.
 */
export function useRadarSignals(options: RadarInitOptions) {
  const radarRef = useRef<RadarScriptAPI | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  // Eagerly start loading during render.
  if (initRef.current === null) {
    initRef.current = loadCollectorsScript({ clientId: options.clientId })
      .then((api) => {
        if (initRef.current !== null) {
          radarRef.current = api;
        }
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });
  }

  useEffect(() => {
    return () => {
      radarRef.current = null;
      initRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.clientId]);

  const getToken = useCallback(async () => {
    await initRef.current;
    if (!radarRef.current) return "";
    return radarRef.current.getToken();
  }, []);

  const getTokenSync = useCallback(
    () => radarRef.current?.getTokenSync() ?? "",
    [],
  );

  return { getToken, getTokenSync };
}
