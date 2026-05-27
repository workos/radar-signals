/**
 * API client for posting signals to the WorkOS /radar/signals endpoint.
 *
 * Design principles:
 * - Single POST with fetch(), no retries
 * - Fail-open: returns signalsId even if API call fails
 * - beacon() uses navigator.sendBeacon with fetch keepalive fallback
 */

import type { Signals } from "../types";

const DEFAULT_API_URL = "https://api.workos.com";

interface PostSignalsParams {
  id: string;
  signals: Signals;
  clientId: string;
  apiUrl?: string;
}

interface PostResult {
  success: boolean;
}

/** POST signals to the WorkOS API. */
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

/** Send signals via sendBeacon (for page unload / redirect scenarios). */
export function beaconSignals(params: PostSignalsParams): boolean {
  const { id, signals, clientId, apiUrl = DEFAULT_API_URL } = params;
  const url = `${apiUrl}/radar/signals`;

  const body = JSON.stringify({
    id,
    signals: { ...signals, submittedAtMs: Date.now() },
  });

  // Try sendBeacon first (more reliable during unload).
  // Note: sendBeacon doesn't support custom headers, so include clientId
  // in the body for the endpoint to extract.
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const beaconBody = JSON.stringify({
      id,
      clientId,
      signals: { ...signals, submittedAtMs: Date.now() },
    });
    const beaconBlob = new Blob([beaconBody], { type: "application/json" });
    const sent = navigator.sendBeacon(url, beaconBlob);
    if (sent) return true;
  }

  // Fallback: fetch with keepalive
  try {
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
  } catch {
    return false;
  }
}
