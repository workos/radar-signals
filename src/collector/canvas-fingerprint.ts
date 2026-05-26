/**
 * Canvas fingerprint: renders a deterministic scene and hashes the PNG output.
 */

import { sha256BufferBase64Url } from './crypto';

function drawCanvasScene(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
): void {
  ctx.font = '18px "Arial", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#e91e63';
  ctx.fillText('WorkOS Radar \u{1F469}\u{200D}\u{1F4BB} 0xA9f3', 2, 20);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(0, 120, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(60, 40, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
  ctx.fillRect(80, 15, 50, 35);

  const grad = ctx.createLinearGradient(150, 0, 280, 60);
  grad.addColorStop(0, '#ff6f00');
  grad.addColorStop(1, '#1a237e');
  ctx.fillStyle = grad;
  ctx.fillRect(150, 10, 120, 45);
}

export const collectCanvasFingerprint = async (): Promise<
  string | undefined
> => {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        const canvas = new OffscreenCanvas(280, 60);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCanvasScene(ctx);
          const blob = await canvas.convertToBlob({ type: 'image/png' });
          const buf = await blob.arrayBuffer();
          return await sha256BufferBase64Url(buf);
        }
      } catch {
        /* fall through to DOM canvas */
      }
    }

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return undefined;
      }

      drawCanvasScene(ctx);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) {
        return undefined;
      }

      const buf = await blob.arrayBuffer();
      return await sha256BufferBase64Url(buf);
    }

    return undefined;
  } catch {
    return undefined;
  }
};
