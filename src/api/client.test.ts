import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  submitSignals,
  beaconSignals,
  DEFAULT_API_URL,
  type SignalsPayload,
} from "./client";
import type { RadarSignalsOptions } from "../types";

const TEST_PAYLOAD: SignalsPayload = {
  id: "01HWXYZ1234567890ABCDEF",
  signals: { timezone: "America/New_York", language: "en-US" },
};

const TEST_OPTIONS: Pick<RadarSignalsOptions, "clientId" | "apiUrl"> = {
  clientId: "client_01ABC",
};

describe("submitSignals", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs signals to the default API URL", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_URL}/radar/signals`,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer client_01ABC",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(TEST_PAYLOAD),
      }),
    );
  });

  it("uses a custom apiUrl when provided", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await submitSignals(TEST_PAYLOAD, {
      ...TEST_OPTIONS,
      apiUrl: "https://custom.api.com",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://custom.api.com/radar/signals",
      expect.anything(),
    );
  });

  it("strips trailing slashes from apiUrl", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await submitSignals(TEST_PAYLOAD, {
      ...TEST_OPTIONS,
      apiUrl: "https://custom.api.com/",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://custom.api.com/radar/signals",
      expect.anything(),
    );
  });

  it("returns submitted: true on 200 response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: true });
  });

  it("returns submitted: true on 201 response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 201 }));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: true });
  });

  it("returns submitted: false on 500 response (fail-open)", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: false });
  });

  it("returns submitted: false on 401 response (fail-open)", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: false });
  });

  it("returns submitted: false on network error (fail-open)", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: false });
  });

  it("always returns the signalsId regardless of outcome", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const result = await submitSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result.signalsId).toBe(TEST_PAYLOAD.id);
  });
});

describe("beaconSignals", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses fetch with keepalive when available", () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", mockFetch);

    const result = beaconSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_API_URL}/radar/signals`,
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        headers: {
          Authorization: "Bearer client_01ABC",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(TEST_PAYLOAD),
      }),
    );
    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: true });
  });

  it("returns submitted: false when fetch is unavailable", () => {
    vi.stubGlobal("fetch", undefined);

    const result = beaconSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result).toEqual({ signalsId: TEST_PAYLOAD.id, submitted: false });
  });

  it("always returns the signalsId (fail-open)", () => {
    vi.stubGlobal("fetch", undefined);

    const result = beaconSignals(TEST_PAYLOAD, TEST_OPTIONS);

    expect(result.signalsId).toBe(TEST_PAYLOAD.id);
  });

  it("does not throw when fetch rejects", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    expect(() => beaconSignals(TEST_PAYLOAD, TEST_OPTIONS)).not.toThrow();
  });

  it("uses custom apiUrl for beacon", () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", mockFetch);

    beaconSignals(TEST_PAYLOAD, {
      ...TEST_OPTIONS,
      apiUrl: "https://custom.api.com",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://custom.api.com/radar/signals",
      expect.anything(),
    );
  });
});
