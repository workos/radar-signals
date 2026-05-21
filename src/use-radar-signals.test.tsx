import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRadarSignals } from "./use-radar-signals";

describe("useRadarSignals", () => {
  it("returns a function that collects signals", () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    expect(result.current).toBeTypeOf("function");
  });

  it("produces a signal when the returned function is called", () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    let signals: ReturnType<typeof result.current> | undefined;
    act(() => {
      signals = result.current();
    });

    expect(signals).toBeDefined();
    expect(signals!.id).toBeTypeOf("string");
    expect(signals!.id.length).toBe(26);
    expect(signals!.collectedAt).toBeTypeOf("string");
  });

  it("returns a stable function reference for the same clientId", () => {
    const { result, rerender } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});
