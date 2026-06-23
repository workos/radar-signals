import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { RadarInitOptions } from "../types";
import {
  loadCollectorsScript,
  getCollectorFromWindow,
  type RadarScriptAPI,
} from "../load-script";

interface RadarContextValue {
  getToken: () => Promise<string>;
  tokenReady: boolean;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export function RadarSignalsProvider({
  children,
  ...options
}: RadarInitOptions & { children: React.ReactNode }) {
  const radarRef = useRef<RadarScriptAPI | null>(null);
  const initRef = useRef<Promise<void> | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    initRef.current = loadCollectorsScript(options)
      .then((api) => {
        if (cancelled) return;
        radarRef.current = api;
        setTokenReady(api.getToken() !== "");
      })
      .catch(() => {
        // Fail open: if the script can't load, getToken returns ""
      });

    return () => {
      cancelled = true;
      radarRef.current = null;
      initRef.current = null;
      setTokenReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.clientId, options.apiUrl]);

  const getToken = useCallback(async () => {
    await initRef.current;
    const api = radarRef.current ?? getCollectorFromWindow();
    if (!api) return "";
    const token = api.getToken();
    if (token) {
      setTokenReady(true);
      return token;
    }
    // Primary API returned empty — try the window fallback in case
    // the collector finished outside the loader flow.
    const fallback = getCollectorFromWindow();
    const fallbackToken = fallback?.getToken() ?? "";
    if (fallbackToken) setTokenReady(true);
    return fallbackToken;
  }, []);

  const value = useMemo(
    () => ({ getToken, tokenReady }),
    [getToken, tokenReady],
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
