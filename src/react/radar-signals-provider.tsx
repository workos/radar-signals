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
  const radarRef = useRef<WorkOSRadar | null>(null);

  useEffect(() => {
    const radar = WorkOSRadar.init(options);
    radarRef.current = radar;
    return () => {
      radar.destroy();
      radarRef.current = null;
    };
    // Re-initialize only when clientId changes
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
