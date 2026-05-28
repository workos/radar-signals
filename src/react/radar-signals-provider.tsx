import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { WorkOSRadar } from "../index";
import type { RadarInitOptions } from "../types";

interface RadarContextValue {
  getToken: () => Promise<string>;
  getTokenSync: () => string;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export function RadarSignalsProvider({
  children,
  ...options
}: RadarInitOptions & { children: React.ReactNode }) {
  // Eagerly initialize during render so the instance is available
  // before any child effects fire (child effects run before parent effects).
  // Re-initialize when clientId changes.
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

  const value = useMemo(
    () => ({ getToken, getTokenSync }),
    [getToken, getTokenSync],
  );

  return (
    <RadarContext.Provider value={value}>{children}</RadarContext.Provider>
  );
}

/**
 * Consume the Radar context to get token retrieval functions.
 * Must be used within a <RadarSignalsProvider>.
 */
export function useRadarToken(): RadarContextValue {
  const ctx = useContext(RadarContext);
  if (!ctx) {
    throw new Error(
      "useRadarToken must be used within a <RadarSignalsProvider>",
    );
  }
  return ctx;
}
