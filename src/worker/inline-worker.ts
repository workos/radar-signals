/**
 * Inline Blob URL worker runner.
 *
 * Creates a Web Worker from a Blob URL (no external file needed),
 * runs the WebGL parameter collection, and returns the result.
 *
 * - CSP consideration: Requires `worker-src blob:` in CSP.
 *   If blocked, gracefully degrades (returns null values).
 * - 5s timeout matches existing implementation.
 */

import { WORKER_SOURCE } from "./worker-source";
import { sha256Base64Url } from "../collector/crypto";

const WORKER_TIMEOUT_MS = 5_000;

export interface WorkerWebGLResult {
  renderer: string | null;
  vendor: string | null;
  paramsHash: string | null;
}

export async function runWebGLWorker(): Promise<WorkerWebGLResult> {
  const fallback: WorkerWebGLResult = {
    renderer: null,
    vendor: null,
    paramsHash: null,
  };

  // Check for Worker support
  if (typeof Worker === "undefined") return fallback;

  let blobUrl: string | null = null;
  let worker: Worker | null = null;

  try {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);
    worker = new Worker(blobUrl);

    const result = await new Promise<WorkerWebGLResult>((resolve) => {
      const timer = setTimeout(() => {
        resolve(fallback);
      }, WORKER_TIMEOUT_MS);

      worker!.onmessage = async (e: MessageEvent) => {
        clearTimeout(timer);
        const data = e.data;
        if (!data?.ok) {
          resolve(fallback);
          return;
        }

        let paramsHash: string | null = null;
        if (data.paramsString) {
          try {
            paramsHash = await sha256Base64Url(data.paramsString);
          } catch {
            // Hash failed
          }
        }

        resolve({
          renderer: data.renderer ?? null,
          vendor: data.vendor ?? null,
          paramsHash,
        });
      };

      worker!.onerror = () => {
        clearTimeout(timer);
        resolve(fallback);
      };

      // Trigger the worker
      worker!.postMessage("start");
    });

    return result;
  } catch {
    // CSP blocked, Worker constructor failed, etc.
    return fallback;
  } finally {
    if (worker) {
      worker.terminate();
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
