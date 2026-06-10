import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { RadarInitOptions } from "../types";
import { loadCollectorsScript, type RadarScriptAPI } from "./load-script";

interface RadarContextValue {
  getToken: () => Promise<string>;
  getTokenSync: () => string;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export function RadarSignalsProvider({
  children,
  ...options
}: RadarInitOptions & { children: React.ReactNode }) {
  const radarRef = useRef<RadarScriptAPI | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  // Eagerly load the collectors script during render.
  // The script self-initializes — it reads window.__WorkOSRadarConfig,
  // collects signals, and posts them to the API on its own.
  if (initRef.current === null) {
    initRef.current = loadCollectorsScript(options)
      .then((api) => {
        radarRef.current = api;
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });
  }

  useEffect(() => {
    // Re-initialize after cleanup (handles StrictMode remount and
    // clientId changes — both null the refs before this runs).
    if (initRef.current === null) {
      initRef.current = loadCollectorsScript(options)
        .then((api) => {
          radarRef.current = api;
        })
        .catch(() => {});
    }

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
