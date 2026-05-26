import { useRef, useEffect, useCallback } from 'react';
import { collectSignals } from './collector';
import type { Signals, RadarInitOptions } from './types';

/**
 * React hook for collecting WorkOS Radar signals.
 *
 * Kicks off signal collection on mount and provides `getSignals()` to
 * retrieve the result. The hook cleans up on unmount.
 */
export function useRadarSignals(
  _options: RadarInitOptions,
): { getSignals: () => Promise<Signals> } {
  const signalsPromiseRef = useRef<Promise<Signals> | null>(null);

  useEffect(() => {
    signalsPromiseRef.current = collectSignals();
    return () => {
      signalsPromiseRef.current = null;
    };
  }, [_options.clientId]);

  const getSignals = useCallback(async (): Promise<Signals> => {
    if (signalsPromiseRef.current) {
      return signalsPromiseRef.current;
    }
    // If called before mount or after unmount, collect fresh
    return collectSignals();
  }, []);

  return { getSignals };
}
