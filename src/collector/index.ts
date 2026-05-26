/**
 * Signal collection orchestrator.
 *
 * Runs all collectors in parallel via Promise.all and assembles the final
 * Signals payload. The output shape matches the server-side allowlists in
 * `packages/api-entities-zod/src/entities/radar-signals.ts`.
 */

import type { Signals, SignalsWorker } from '../types';
import { collectNavigatorSignals } from './navigator-signals';
import { collectBotSignals } from './bot-detectors';
import { collectCanvasFingerprint } from './canvas-fingerprint';
import { collectAudioFingerprint } from './audio-fingerprint';
import {
  collectMainThreadWebGlInfo,
  collectWebGLParamsHash,
} from './webgl-signals';
import { collectMathFingerprint } from './math-fingerprint';
import { collectIntlFingerprint } from './intl-fingerprint';
import { collectMediaPreferences } from './media-preferences';
import { collectMinimalSurface } from './minimal-surface';

export type CollectSignalsOptions = {
  /**
   * Optional function that runs the Web Worker and returns its signals.
   * When not provided, the worker field defaults to `{ ok: false, error: 'not configured' }`.
   * Provided by the WorkOSRadar main class (RDR-726/727).
   */
  runWorker?: () => Promise<SignalsWorker>;

  /**
   * Optional puppeteer detector snapshot.
   * When not provided, puppeteer fields default to `false`.
   * Provided by the WorkOSRadar main class (RDR-725/727).
   */
  puppeteerSnapshot?: () => {
    detected: boolean;
    documentNotAvailable: boolean;
  };
};

const DEFAULT_WORKER_RESULT: SignalsWorker = {
  ok: false,
  error: 'not configured',
};

/**
 * Collect all browser signals. Returns the full `Signals` shape expected by
 * the WorkOS API.
 *
 * `createdAtMs` is stamped at the start of collection. `submittedAtMs` is
 * NOT set here — it is stamped by the API client when signals are POSTed.
 */
export async function collectSignals(
  options: CollectSignalsOptions = {},
): Promise<Signals> {
  const createdAtMs = Date.now();

  // Synchronous collectors
  const botSignals = collectBotSignals();
  const { ctx: glCtx, ...glInfo } = collectMainThreadWebGlInfo();
  const mediaPreferences = collectMediaPreferences();

  // Puppeteer snapshot (provided externally, defaults to not detected)
  const puppeteer = options.puppeteerSnapshot?.() ?? {
    detected: false,
    documentNotAvailable: false,
  };

  // Async collectors run in parallel
  const [
    navigatorSignals,
    minimalSurface,
    worker,
    canvasHash,
    audioHash,
    mathHash,
    intlHash,
    webGLParamsHash,
  ] = await Promise.all([
    collectNavigatorSignals(),
    collectMinimalSurface(),
    options.runWorker?.() ?? Promise.resolve(DEFAULT_WORKER_RESULT),
    collectCanvasFingerprint(),
    collectAudioFingerprint(),
    collectMathFingerprint(),
    collectIntlFingerprint(),
    glCtx ? collectWebGLParamsHash(glCtx) : Promise.resolve(undefined),
  ]);

  return {
    createdAtMs,
    ...navigatorSignals,
    ...botSignals,
    ...glInfo,
    puppeteerDetected: puppeteer.detected,
    puppeteerDocumentNotAvailable: puppeteer.documentNotAvailable,
    mediaPreferences,
    minimalSurface,
    worker,
    canvasHash,
    audioHash,
    mathHash,
    intlHash,
    webGLParamsHash,
  };
}
