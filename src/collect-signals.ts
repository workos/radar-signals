import { ulid } from "ulidx";
import type { RadarSignals, RadarSignalsOptions } from "./types";

/**
 * Collect browser signals for WorkOS Radar.
 */
export function collectSignals(_options: RadarSignalsOptions): RadarSignals {
  return {
    id: ulid(),
    collectedAt: new Date().toISOString(),
  };
}
