export const DEFAULT_API_URL = "https://api.workos.com";
const SIGNALS_PATH = "/radar/signals";

export interface SignalsPayload {
  id: string;
  signals: Record<string, unknown>;
}

export interface ClientOptions {
  clientId: string;
  apiUrl?: string;
}

export interface SubmitResult {
  signalsId: string;
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
 * Submit signals via a fire-and-forget mechanism for page-unload scenarios.
 *
 * Uses fetch with keepalive (preferred, supports Authorization header),
 * falling back to navigator.sendBeacon.
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
    // Prefer fetch + keepalive: supports custom headers
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: buildHeaders(options.clientId),
        body,
        keepalive: true,
      }).catch(() => {});

      return { signalsId: payload.id, submitted: true };
    }

    // Fallback: sendBeacon (no custom headers supported)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      return { signalsId: payload.id, submitted: sent };
    }

    return { signalsId: payload.id, submitted: false };
  } catch {
    return { signalsId: payload.id, submitted: false };
  }
}
