import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { RadarSignalsProvider, useRadarToken } from "../radar-signals-provider";
import { useRadarSignals } from "../use-radar-signals";

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RadarSignalsProvider + useRadarToken", () => {
  it("provides getToken and getTokenSync functions", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_123">
        {children}
      </RadarSignalsProvider>
    );

    const { result } = renderHook(() => useRadarToken(), { wrapper });

    expect(result.current.getToken).toBeTypeOf("function");
    expect(result.current.getTokenSync).toBeTypeOf("function");
  });

  it("getToken() returns a token string", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_123">
        {children}
      </RadarSignalsProvider>
    );

    const { result } = renderHook(() => useRadarToken(), { wrapper });

    let token: string | undefined;
    await act(async () => {
      token = await result.current.getToken();
    });

    expect(token).toBeTypeOf("string");
    expect(token!.length).toBe(26);
  });

  it("throws when useRadarToken is used outside provider", () => {
    expect(() => {
      renderHook(() => useRadarToken());
    }).toThrow("useRadarToken must be used within a <RadarSignalsProvider>");
  });
});

describe("useRadarSignals (standalone hook)", () => {
  it("returns getToken and getTokenSync functions", () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    expect(result.current.getToken).toBeTypeOf("function");
    expect(result.current.getTokenSync).toBeTypeOf("function");
  });

  it("getToken() returns a token string", async () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    let token: string | undefined;
    await act(async () => {
      token = await result.current.getToken();
    });

    expect(token).toBeTypeOf("string");
    expect(token!.length).toBe(26);
  });

  it("maintains stable function references across re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first.getToken).toBe(second.getToken);
    expect(first.getTokenSync).toBe(second.getTokenSync);
  });
});
