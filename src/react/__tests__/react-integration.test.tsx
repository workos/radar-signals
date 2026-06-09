import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";

vi.mock("../load-script", () => {
  const token = "01ARYZ6S41TSV4RRFFQ69G5FAV";
  const destroy = vi.fn();
  const getToken = vi.fn().mockResolvedValue(token);
  const getTokenSync = vi.fn().mockReturnValue(token);
  const init = vi.fn().mockReturnValue({
    getToken,
    getTokenSync,
    refresh: vi.fn().mockResolvedValue(token),
    destroy,
  });

  return {
    loadCollectorsScript: vi.fn().mockResolvedValue({ init }),
  };
});

import { loadCollectorsScript } from "../load-script";
import { RadarSignalsProvider, useRadarToken } from "../radar-signals-provider";
import { useRadarSignals } from "../use-radar-signals";

beforeEach(() => {
  vi.clearAllMocks();
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

  it("initializes WorkOSRadar with the provided options", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_456" apiUrl="https://custom.api.com">
        {children}
      </RadarSignalsProvider>
    );

    renderHook(() => useRadarToken(), { wrapper });

    // Wait for the async init to complete
    await act(async () => {});

    const { init } = await vi.mocked(loadCollectorsScript)();
    expect(init).toHaveBeenCalledWith({
      clientId: "client_test_456",
      apiUrl: "https://custom.api.com",
    });
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
