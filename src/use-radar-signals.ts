import { useCallback } from "react";
import { collectSignals } from "./collect-signals";
import type { RadarSignals, RadarSignalsOptions } from "./types";

/**
 * React hook for collecting WorkOS Radar signals.
 */
export function useRadarSignals(
  options: RadarSignalsOptions,
): () => RadarSignals {
  return useCallback(() => collectSignals(options), [options.clientId]);
}
