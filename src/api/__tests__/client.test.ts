import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postSignals, beaconSignals } from "../client";
import type { Signals } from "../../types";

const MOCK_SIGNALS: Signals = {
  timezone: "America/New_York",
  language: "en-US",
  hardwareConcurrency: 8,
  webdriver: false,
  userAgent: "test",
  appVersion: "test",
  platform: "test",
  maxTouchPoints: 0,
  deviceMemory: 8,
  devicePixelRatio: 2,
  documentHidden: false,
  documentVisibilityState: "visible",
  screenWidth: 1920,
  screenHeight: 1080,
  screenAvailWidth: 1920,
  screenAvailHeight: 1080,
  screenColorDepth: 24,
  screenPixelDepth: 24,
  screenOrientationType: "landscape-primary",
  screenOrientationAngle: 0,
  permissionCamera: "prompt",
  permissionMicrophone: "prompt",
  permissionNotifications: "prompt",
  permissionGeolocation: "prompt",
  plugins: "",
  mimeTypes: "",
  seleniumDetected: false,
  playwrightDetected: false,
  phantomDetected: false,
  nightmareDetected: false,
  puppeteerDetected: false,
  puppeteerDocumentNotAvailable: false,
  canvasHash: "abc123",
  audioHash: "def456",
  webGLRenderer: "ANGLE",
  webGLVendor: "Google",
  webGLParamsHash: "ghi789",
  mathHash: "math123",
  intlHash: "intl456",
  mediaPreferences: {
    prefersColorScheme: "light",
    prefersReducedMotion: "no-preference",
    prefersReducedTransparency: "no-preference",
    prefersContrast: "no-preference",
    forcedColors: "no-preference",
    invertedColors: "no-preference",
    prefersReducedData: "no-preference",
    colorGamut: "srgb",
  },
  windowFeatures: { hash: "wf123", count: 100 },
  cssKeys: { hash: "css123", count: 200 },
  voices: { hash: "voice123", count: 10 },
  mediaMime: { hash: "mime123", count: 15 },
  fonts: { hash: "font123", count: 12 },
  rangeErrorLength: 42,
  evalStringLength: 33,
  createdAtMs: Date.now(),
};

describe("postSignals", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a POST request with correct headers and body", async () => {
    const result = await postSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
    });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://api.workos.com/radar/signals");
    expect(options!.method).toBe("POST");
    expect(options!.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer client_123",
    });

    const body = JSON.parse(options!.body as string);
    expect(body.id).toBe("test-id");
    expect(body.signals).toHaveProperty("submittedAtMs");
  });

  it("uses custom apiUrl when provided", async () => {
    await postSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
      apiUrl: "https://custom.api.com",
    });

    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://custom.api.com/radar/signals");
  });

  it("returns success: false when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await postSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
    });

    expect(result.success).toBe(false);
  });

  it("returns success: false when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const result = await postSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
    });

    expect(result.success).toBe(false);
  });
});

describe("beaconSignals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses sendBeacon when available", () => {
    const mockSendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    });

    const result = beaconSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
    });

    expect(result).toBe(true);
    expect(mockSendBeacon).toHaveBeenCalledOnce();
  });

  it("falls back to fetch with keepalive when sendBeacon is not available", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = beaconSignals({
      id: "test-id",
      signals: MOCK_SIGNALS,
      clientId: "client_123",
    });

    expect(result).toBe(true);
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(options!.keepalive).toBe(true);
  });
});
