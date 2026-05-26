/**
 * Inline Blob URL worker runner.
 *
 * Creates a Web Worker from a Blob URL (no external file needed),
 * runs WebGL + navigator collection, and returns a SignalsWorker result.
 *
 * - CSP consideration: Requires `worker-src blob:` in CSP.
 *   If blocked, gracefully degrades (returns { ok: false }).
 * - 5s timeout matches existing implementation.
 */

import { WORKER_SOURCE } from "./worker-source";
import type { SignalsWorker } from "../types";

const WORKER_TIMEOUT_MS = 5_000;

const FALLBACK: SignalsWorker = { ok: false, error: "worker unavailable" };
const TIMEOUT_FALLBACK: SignalsWorker = { ok: false, timeout: true };

export async function runWebGLWorker(): Promise<SignalsWorker> {
  // Check for Worker support
  if (typeof Worker === "undefined") return FALLBACK;

  let blobUrl: string | null = null;
  let worker: Worker | null = null;

  try {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);
    worker = new Worker(blobUrl);

    const result = await new Promise<SignalsWorker>((resolve) => {
      const timer = setTimeout(() => {
        resolve(TIMEOUT_FALLBACK);
      }, WORKER_TIMEOUT_MS);

      worker!.onmessage = (e: MessageEvent) => {
        clearTimeout(timer);
        const data = e.data;
        if (!data?.ok) {
          resolve({ ok: false, error: data?.error });
          return;
        }

        resolve({
          ok: true,
          webGLRenderer: data.webGLRenderer,
          webGLVendor: data.webGLVendor,
          hardwareConcurrency: data.hardwareConcurrency,
          platform: data.platform,
          userAgent: data.userAgent,
          language: data.language,
        });
      };

      worker!.onerror = () => {
        clearTimeout(timer);
        resolve({ ok: false, error: "worker error" });
      };

      // Trigger the worker
      worker!.postMessage("start");
    });

    return result;
  } catch {
    // CSP blocked, Worker constructor failed, etc.
    return FALLBACK;
  } finally {
    if (worker) {
      worker.terminate();
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
