import type { RadarInitOptions } from "../types";

export const DEFAULT_API_URL = "https://api.workos.com";
const SIGNALS_PATH = "/radar/signals";

export interface SignalsPayload {
  id: string;
  signals: Record<string, unknown>;
}

export type ClientOptions = Pick<RadarInitOptions, "clientId" | "apiUrl">;

export interface SubmitResult {
  signalsId: string;
  /**
   * For {@link submitSignals}: `true` when the server responded with 2xx.
   * For {@link beaconSignals}: `true` when the request was dispatched
   * (fire-and-forget — the server response is not awaited).
   */
  submitted: boolean;
}

function buildUrl(options: ClientOptions): string {
  const base = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
  return `${base}${SIGNALS_PATH}`;
}

function buildHeaders(clientId: string): Record<string, string> {
  return {
    Authorization: `Bearer ${clientId}`,
    "Content-Type": "application/json",
  };
}

/**
 * Submit signals to the WorkOS Radar API via fetch.
 *
 * Fail-open: always returns the signalsId, even if the request fails.
 * No retries — a single POST attempt.
 */
export async function submitSignals(
  payload: SignalsPayload,
  options: ClientOptions,
): Promise<SubmitResult> {
  const url = buildUrl(options);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(options.clientId),
      body: JSON.stringify(payload),
    });

    return { signalsId: payload.id, submitted: response.ok };
  } catch {
    return { signalsId: payload.id, submitted: false };
  }
}

/**
 * Submit signals via fetch with `keepalive` for page-unload scenarios.
 *
 * This is fire-and-forget: the request is dispatched and the function
 * returns immediately without awaiting a server response. The `submitted`
 * field indicates whether the request was dispatched, not whether the
 * server accepted it.
 *
 * Fail-open: always returns the signalsId.
 */
export function beaconSignals(
  payload: SignalsPayload,
  options: ClientOptions,
): SubmitResult {
  const url = buildUrl(options);
  const body = JSON.stringify(payload);

  try {
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: buildHeaders(options.clientId),
        body,
        keepalive: true,
      }).catch(() => {});

      return { signalsId: payload.id, submitted: true };
    }

    return { signalsId: payload.id, submitted: false };
  } catch {
    return { signalsId: payload.id, submitted: false };
  }
}
