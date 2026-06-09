import { useRef, useEffect, useCallback } from "react";
import type { RadarInitOptions } from "../types";
import { loadCollectorsScript, type RadarInstance } from "./load-script";

/**
 * Standalone hook (no context needed) for signal collection.
 * Loads the collectors script from the CDN and initializes Radar.
 * Cleans up on unmount.
 */
export function useRadarSignals(options: RadarInitOptions) {
  const radarRef = useRef<RadarInstance | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  // Eagerly start loading + initialization during render.
  if (initRef.current === null) {
    initRef.current = loadCollectorsScript()
      .then((Radar) => {
        if (initRef.current !== null && radarRef.current === null) {
          radarRef.current = Radar.init(options);
        }
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });
  }

  useEffect(() => {
    return () => {
      radarRef.current?.destroy();
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
