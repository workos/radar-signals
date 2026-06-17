import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../react/load-script", () => ({
  loadCollectorsScript: vi.fn().mockResolvedValue({
    getToken: vi.fn().mockResolvedValue("01ARYZ6S41TSV4RRFFQ69G5FAV"),
    getTokenSync: vi.fn().mockReturnValue("01ARYZ6S41TSV4RRFFQ69G5FAV"),
  }),
  getCollectorFromWindow: vi.fn().mockReturnValue(null),
}));

import { WorkOSRadar } from "../index";
import { loadCollectorsScript } from "../react/load-script";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorkOSRadar", () => {
  it("can be initialized with init()", () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    expect(radar).toBeInstanceOf(WorkOSRadar);
  });

  it("passes options to loadCollectorsScript", () => {
    WorkOSRadar.init({ clientId: "client_test_456", apiUrl: "https://custom.api.com" });

    expect(vi.mocked(loadCollectorsScript)).toHaveBeenCalledWith({
      clientId: "client_test_456",
      apiUrl: "https://custom.api.com",
    });
  });

  it("getToken() returns the token from the CDN script", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token = await radar.getToken();
    expect(token).toBe("01ARYZ6S41TSV4RRFFQ69G5FAV");
  });

  it("getToken() returns the same token on multiple calls", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token1 = await radar.getToken();
    const token2 = await radar.getToken();
    expect(token1).toBe(token2);
  });

  it("getTokenSync() returns the token from the CDN script", async () => {
    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    await radar.getToken();
    const token = radar.getTokenSync();
    expect(token).toBe("01ARYZ6S41TSV4RRFFQ69G5FAV");
  });

  it("getToken() returns empty string when CDN script fails to load", async () => {
    vi.mocked(loadCollectorsScript).mockRejectedValueOnce(new Error("network"));

    const radar = WorkOSRadar.init({ clientId: "client_test_123" });
    const token = await radar.getToken();
    expect(token).toBe("");
  });
});
