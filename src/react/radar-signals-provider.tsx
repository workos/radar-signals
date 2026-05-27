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
  // Lazy-initialize on first render so the instance is available
  // before any child effects fire (child effects run before parent effects).
  const radarRef = useRef<WorkOSRadar | null>(null);
  if (radarRef.current === null) {
    radarRef.current = WorkOSRadar.init(options);
  }

  useEffect(() => {
    // Capture the instance that was created during render.
    // On Strict Mode remount, radarRef.current was already re-created
    // by the lazy init above, so just capture it for cleanup.
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
