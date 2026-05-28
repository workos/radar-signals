import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { WorkOSRadar } from "../../index";
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
  vi.restoreAllMocks();
});

describe("RadarSignalsProvider + useRadarToken", () => {
  it("calls init() on mount and destroy() on unmount", () => {
    const mockDestroy = vi.fn();
    const mockInstance = {
      getToken: vi.fn().mockResolvedValue("mock-token"),
      getTokenSync: vi.fn().mockReturnValue("mock-token"),
      destroy: mockDestroy,
    };
    const initSpy = vi
      .spyOn(WorkOSRadar, "init")
      .mockReturnValue(mockInstance as unknown as WorkOSRadar);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_123">
        {children}
      </RadarSignalsProvider>
    );

    const { unmount } = renderHook(() => useRadarToken(), { wrapper });

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_test_123" });

    unmount();

    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("forwards all RadarInitOptions to init()", () => {
    const mockInstance = {
      getToken: vi.fn().mockResolvedValue("mock-token"),
      getTokenSync: vi.fn().mockReturnValue("mock-token"),
      destroy: vi.fn(),
    };
    const initSpy = vi
      .spyOn(WorkOSRadar, "init")
      .mockReturnValue(mockInstance as unknown as WorkOSRadar);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider
        clientId="client_test_123"
        apiUrl="https://custom.api.com"
      >
        {children}
      </RadarSignalsProvider>
    );

    renderHook(() => useRadarToken(), { wrapper });

    expect(initSpy).toHaveBeenCalledWith({
      clientId: "client_test_123",
      apiUrl: "https://custom.api.com",
    });
  });

  it("throws when useRadarToken is used outside provider", () => {
    expect(() => {
      renderHook(() => useRadarToken());
    }).toThrow("useRadarToken must be used within a <RadarSignalsProvider>");
  });

  it("getToken() returns the correlation token", async () => {
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
    expect(token!.length).toBe(26); // ULID length
  });

  it("getTokenSync() returns a token for redirect/OAuth flows", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_123">
        {children}
      </RadarSignalsProvider>
    );

    const { result } = renderHook(() => useRadarToken(), { wrapper });

    const token = result.current.getTokenSync();
    expect(token).toBeTypeOf("string");
    expect(token.length).toBe(26); // ULID length
  });

  it("re-initializes when clientId changes", () => {
    const destroyFns: ReturnType<typeof vi.fn>[] = [];
    const initSpy = vi
      .spyOn(WorkOSRadar, "init")
      .mockImplementation(() => {
        const destroy = vi.fn();
        destroyFns.push(destroy);
        return {
          getToken: vi.fn().mockResolvedValue("mock-token"),
          getTokenSync: vi.fn().mockReturnValue("mock-token"),
          destroy,
        } as unknown as WorkOSRadar;
      });

    let clientId = "client_old";
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId={clientId}>
        {children}
      </RadarSignalsProvider>
    );

    const { result, rerender } = renderHook(() => useRadarToken(), {
      wrapper,
    });

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_old" });
    expect(initSpy).toHaveBeenCalledTimes(1);

    clientId = "client_new";
    rerender();

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_new" });
    expect(initSpy).toHaveBeenCalledTimes(2);
    // Old instance should be destroyed by effect cleanup
    expect(destroyFns[0]).toHaveBeenCalledOnce();
    // New instance should still be functional
    expect(result.current.getToken).toBeTypeOf("function");
    expect(result.current.getTokenSync).toBeTypeOf("function");
  });

  it("maintains stable function references across re-renders", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadarSignalsProvider clientId="client_test_123">
        {children}
      </RadarSignalsProvider>
    );

    const { result, rerender } = renderHook(() => useRadarToken(), {
      wrapper,
    });

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first.getToken).toBe(second.getToken);
    expect(first.getTokenSync).toBe(second.getTokenSync);
  });
});

describe("useRadarSignals (standalone hook)", () => {
  it("calls init() on mount and destroy() on unmount", () => {
    const mockDestroy = vi.fn();
    const mockInstance = {
      getToken: vi.fn().mockResolvedValue("mock-token"),
      getTokenSync: vi.fn().mockReturnValue("mock-token"),
      destroy: mockDestroy,
    };
    const initSpy = vi
      .spyOn(WorkOSRadar, "init")
      .mockReturnValue(mockInstance as unknown as WorkOSRadar);

    const { unmount } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_test_123" });

    unmount();

    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("getToken() returns the correlation token", async () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    let token: string | undefined;
    await act(async () => {
      token = await result.current.getToken();
    });

    expect(token).toBeTypeOf("string");
    expect(token!.length).toBe(26); // ULID length
  });

  it("getTokenSync() returns a token for redirect/OAuth flows", () => {
    const { result } = renderHook(() =>
      useRadarSignals({ clientId: "client_test_123" }),
    );

    const token = result.current.getTokenSync();
    expect(token).toBeTypeOf("string");
    expect(token.length).toBe(26); // ULID length
  });

  it("re-initializes when clientId changes", () => {
    const destroyFns: ReturnType<typeof vi.fn>[] = [];
    const initSpy = vi
      .spyOn(WorkOSRadar, "init")
      .mockImplementation(() => {
        const destroy = vi.fn();
        destroyFns.push(destroy);
        return {
          getToken: vi.fn().mockResolvedValue("mock-token"),
          getTokenSync: vi.fn().mockReturnValue("mock-token"),
          destroy,
        } as unknown as WorkOSRadar;
      });

    let clientId = "client_old";
    const { result, rerender } = renderHook(() =>
      useRadarSignals({ clientId }),
    );

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_old" });
    expect(initSpy).toHaveBeenCalledTimes(1);

    clientId = "client_new";
    rerender();

    expect(initSpy).toHaveBeenCalledWith({ clientId: "client_new" });
    expect(initSpy).toHaveBeenCalledTimes(2);
    expect(destroyFns[0]).toHaveBeenCalledOnce();
    expect(result.current.getToken).toBeTypeOf("function");
    expect(result.current.getTokenSync).toBeTypeOf("function");
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
