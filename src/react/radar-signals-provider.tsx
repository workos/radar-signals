import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { RadarInitOptions } from "../types";
import { loadCollectorsScript, type RadarInstance } from "./load-script";

interface RadarContextValue {
  getToken: () => Promise<string>;
  getTokenSync: () => string;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export function RadarSignalsProvider({
  children,
  ...options
}: RadarInitOptions & { children: React.ReactNode }) {
  const radarRef = useRef<RadarInstance | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  // Eagerly start loading the collectors script + initialization during
  // render so signals begin collecting as early as possible. The script
  // is cached globally, so subsequent mounts resolve near-instantly.
  if (initRef.current === null) {
    initRef.current = loadCollectorsScript()
      .then((Radar) => {
        // Guard: only init if this mount cycle is still active.
        // After cleanup, initRef is nulled — prevents orphan instances.
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
