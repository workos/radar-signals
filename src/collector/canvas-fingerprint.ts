/**
 * Canvas fingerprinting via a deterministic drawing scene.
 * Renders text, shapes, and gradients to a canvas and SHA-256 hashes the result.
 */

import { sha256Base64Url } from "./crypto";

function drawCanvasScene(ctx: CanvasRenderingContext2D): void {
  // Background
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, 300, 150);

  // Text with specific font stack
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.fillStyle = "#069";
  ctx.fillText("WorkOS Radar <canvas> fp", 2, 2);

  // Smaller text with different font
  ctx.font = "11px 'Times New Roman'";
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("Signal collection", 4, 22);

  // Colored rectangle
  ctx.fillStyle = "rgb(255, 0, 255)";
  ctx.fillRect(100, 30, 80, 50);

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 300, 0);
  gradient.addColorStop(0, "red");
  gradient.addColorStop(0.5, "green");
  gradient.addColorStop(1, "blue");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 90, 300, 20);

  // Circle
  ctx.beginPath();
  ctx.arc(50, 70, 20, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 0, 128, 0.5)";
  ctx.fill();

  // Emoji (varies by OS/renderer)
  ctx.font = "18px Arial";
  ctx.fillText("😀🔒", 200, 50);
}

export async function collectCanvasFingerprint(): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    drawCanvasScene(ctx);
    const dataUrl = canvas.toDataURL("image/png");
    return sha256Base64Url(dataUrl);
  } catch {
    return null;
  }
}
