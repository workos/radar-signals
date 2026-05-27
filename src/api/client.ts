/**
 * API client for posting signals to the WorkOS /radar/signals endpoint.
 *
 * Design principles:
 * - Single POST with fetch(), no retries
 * - Fail-open: returns signalsId even if API call fails
 * - beaconSignals uses fetch with keepalive for page-unload scenarios
 */

import type { Signals } from "../types";

const DEFAULT_API_URL = "https://api.workos.com";

export interface PostSignalsParams {
  id: string;
  signals: Signals;
  clientId: string;
  apiUrl?: string;
}

export interface PostResult {
  success: boolean;
}

/**
 * POST signals to the WorkOS API.
 *
 * Fail-open: always resolves (never throws). Returns `{ success: true }`
 * only when the server responds with 2xx.
 */
export async function postSignals(
  params: PostSignalsParams,
): Promise<PostResult> {
  const { id, signals, clientId, apiUrl = DEFAULT_API_URL } = params;
  const url = `${apiUrl}/radar/signals`;

  const body = JSON.stringify({
    id,
    signals: { ...signals, submittedAtMs: Date.now() },
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientId}`,
      },
      body,
    });

    return { success: response.ok };
  } catch {
    return { success: false };
  }
}

/**
 * Send signals via fetch with `keepalive` for page-unload / redirect
 * scenarios. Fire-and-forget: the request is dispatched and the function
 * returns immediately without awaiting a server response.
 *
 * Returns `true` when the request was dispatched, `false` otherwise.
 * Fail-open: never throws.
 */
export function beaconSignals(params: PostSignalsParams): boolean {
  const { id, signals, clientId, apiUrl = DEFAULT_API_URL } = params;
  const url = `${apiUrl}/radar/signals`;

  const body = JSON.stringify({
    id,
    signals: { ...signals, submittedAtMs: Date.now() },
  });

  try {
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientId}`,
        },
        body,
        keepalive: true,
      }).catch(() => {
        // Intentionally swallowed — fail-open
      });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
