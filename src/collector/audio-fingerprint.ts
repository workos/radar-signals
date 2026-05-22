/**
 * Audio fingerprinting via OfflineAudioContext.
 * Creates an oscillator + compressor, renders a short buffer,
 * and SHA-256 hashes a slice of the resulting audio data.
 */

import { sha256Base64Url } from "./crypto";

export async function collectAudioFingerprint(): Promise<string | null> {
  try {
    const AudioCtx =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;

    if (!AudioCtx) return null;

    const context = new AudioCtx(1, 44100, 44100);

    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    // Hash a representative slice of the audio data
    const slice = channelData.slice(4500, 5000);
    const values = Array.from(slice).map((v) => v.toString()).join(",");
    return sha256Base64Url(values);
  } catch {
    return null;
  }
}
