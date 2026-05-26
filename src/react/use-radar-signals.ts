import { useRef, useEffect, useCallback } from "react";
import { WorkOSRadar } from "../index";
import type { RadarInitOptions } from "../types";

/**
 * Standalone hook (no context needed) for signal collection.
 * Initializes Radar eagerly during render and cleans up on unmount.
 */
export function useRadarSignals(options: RadarInitOptions) {
  // Lazy-initialize on first render so the instance is available
  // immediately (before any effects fire).
  const radarRef = useRef<WorkOSRadar | null>(null);
  if (radarRef.current === null) {
    radarRef.current = WorkOSRadar.init(options);
  }

  useEffect(() => {
    const radar = radarRef.current!;
    return () => {
      radar.destroy();
      radarRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.clientId]);

  const getToken = useCallback(
    () => radarRef.current!.getToken(),
    [],
  );

  const getTokenSync = useCallback(
    () => radarRef.current!.getTokenSync(),
    [],
  );

  return { getToken, getTokenSync };
}
