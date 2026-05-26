import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRadarSignals } from './use-radar-signals';
import type { Signals } from './types';

const MOCK_SIGNALS: Signals = {
  screen: { width: 1920, height: 1080 },
  worker: { ok: false, error: 'not configured' },
  createdAtMs: 1234567890,
};

vi.mock('./collector', () => ({
  collectSignals: vi.fn(() => Promise.resolve(MOCK_SIGNALS)),
}));

describe('useRadarSignals', () => {
  it('returns an object with a getSignals method', () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: 'client_test_123' }),
    );

    expect(result.current).toHaveProperty('getSignals');
    expect(result.current.getSignals).toBeTypeOf('function');
  });

  it('getSignals returns a promise that resolves to signals', async () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: 'client_test_123' }),
    );

    let signals: Signals | undefined;
    await act(async () => {
      signals = await result.current.getSignals();
    });

    expect(signals).toBeDefined();
    expect(signals).toEqual(MOCK_SIGNALS);
  });

  it('returns a stable getSignals reference across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useRadarSignals({ clientId: 'client_test_123' }),
    );

    const first = result.current.getSignals;
    rerender();
    const second = result.current.getSignals;

    expect(first).toBe(second);
  });

  it('collects fresh signals when called before mount or after unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useRadarSignals({ clientId: 'client_test_123' }),
    );

    const getSignals = result.current.getSignals;
    unmount();

    // After unmount, getSignals should still work by collecting fresh signals
    let signals: Signals | undefined;
    await act(async () => {
      signals = await getSignals();
    });

    expect(signals).toBeDefined();
    expect(signals).toEqual(MOCK_SIGNALS);
  });
});
