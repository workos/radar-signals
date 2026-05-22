/**
 * Orchestrator: runs all signal collectors via Promise.all.
 */

import type { Signals } from "../types";
import { collectNavigatorSignals } from "./navigator-signals";
import { collectBotSignals } from "./bot-detectors";
import { collectCanvasFingerprint } from "./canvas-fingerprint";
import { collectAudioFingerprint } from "./audio-fingerprint";
import { collectWebGLSignals } from "./webgl-signals";
import { collectMathFingerprint } from "./math-fingerprint";
import { collectIntlFingerprint } from "./intl-fingerprint";
import { collectMediaPreferences } from "./media-preferences";
import {
  collectWindowFeatures,
  collectCssKeys,
  collectVoices,
  collectMediaMime,
  collectFonts,
} from "./minimal-surface";

function collectRangeErrorLength(): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Array(1e12) as any).fill(0);
    return null;
  } catch (e) {
    return e instanceof RangeError ? (e.message?.length ?? null) : null;
  }
}

function collectEvalStringLength(): number | null {
  try {
    return eval.toString().length;
  } catch {
    return null;
  }
}

export async function collectAllSignals(
  puppeteerState: {
    puppeteerDetected: boolean;
    puppeteerDocumentNotAvailable: boolean;
  },
): Promise<Signals> {
  const createdAtMs = Date.now();

  const [
    navSignals,
    canvasHash,
    audioHash,
    webGLSignals,
    mathHash,
    intlHash,
    windowFeatures,
    cssKeys,
    voices,
    mediaMime,
    fonts,
  ] = await Promise.all([
    collectNavigatorSignals(),
    collectCanvasFingerprint(),
    collectAudioFingerprint(),
    collectWebGLSignals(),
    collectMathFingerprint(),
    collectIntlFingerprint(),
    collectWindowFeatures(),
    collectCssKeys(),
    collectVoices(),
    collectMediaMime(),
    collectFonts(),
  ]);

  const botSignals = collectBotSignals();
  const mediaPreferences = collectMediaPreferences();
  const rangeErrorLength = collectRangeErrorLength();
  const evalStringLength = collectEvalStringLength();

  return {
    ...navSignals,
    ...botSignals,
    ...puppeteerState,
    canvasHash,
    audioHash,
    ...webGLSignals,
    mathHash,
    intlHash,
    mediaPreferences,
    windowFeatures,
    cssKeys,
    voices,
    mediaMime,
    fonts,
    rangeErrorLength,
    evalStringLength,
    createdAtMs,
  };
}
