import { useRef, useEffect, useCallback } from "react";
import { WorkOSRadar } from "../index";
import type { RadarInitOptions } from "../types";

/**
 * Standalone hook (no context needed) for signal collection.
 * Initializes Radar on mount and cleans up on unmount.
 */
export function useRadarSignals(options: RadarInitOptions) {
  const radarRef = useRef<WorkOSRadar | null>(null);

  useEffect(() => {
    const radar = WorkOSRadar.init(options);
    radarRef.current = radar;
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
