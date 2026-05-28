import { useRef, useEffect, useCallback } from "react";
import { WorkOSRadar } from "../index";
import type { RadarInitOptions } from "../types";

/**
 * Standalone hook (no context needed) for signal collection.
 * Initializes Radar eagerly during render and cleans up on unmount.
 */
export function useRadarSignals(options: RadarInitOptions) {
  // Eagerly initialize during render so the instance is available
  // immediately (before any effects fire). Re-initialize when clientId changes.
  const radarRef = useRef<WorkOSRadar | null>(null);
  const clientIdRef = useRef(options.clientId);

  if (
    radarRef.current === null ||
    clientIdRef.current !== options.clientId
  ) {
    radarRef.current = WorkOSRadar.init(options);
    clientIdRef.current = options.clientId;
  }

  useEffect(() => {
    const radar = radarRef.current!;
    return () => {
      radar.destroy();
      // Only null the ref on true unmount. When clientId changes,
      // the render phase already replaced radarRef.current with a
      // new instance — don't clobber it.
      if (radarRef.current === radar) {
        radarRef.current = null;
      }
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
