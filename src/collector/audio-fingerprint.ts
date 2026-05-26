/**
 * Audio fingerprint: renders a short oscillator + compressor pipeline
 * via OfflineAudioContext and hashes the tail of the resulting buffer.
 */

import { sha256Base64Url } from './crypto';

export const collectAudioFingerprint = async (): Promise<
  string | undefined
> => {
  try {
    const ctx = new OfflineAudioContext(1, 5000, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, ctx.currentTime);
    compressor.knee.setValueAtTime(40, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(data[i] ?? 0);
    }

    return await sha256Base64Url(sum.toString());
  } catch {
    return undefined;
  }
};
