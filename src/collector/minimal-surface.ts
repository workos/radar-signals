/**
 * Minimal-surface fingerprinting: window features, CSS keys, voices,
 * MIME types, and fonts. Each produces a hash + count pair.
 */

import type { HashCount } from "../types";
import { hashList } from "./crypto";

/** Collect enumerable window property names. */
export async function collectWindowFeatures(): Promise<HashCount | null> {
  try {
    const keys = Object.getOwnPropertyNames(window).sort();
    return { hash: await hashList(keys), count: keys.length };
  } catch {
    return null;
  }
}

/** Collect CSS property names from computed style. */
export async function collectCssKeys(): Promise<HashCount | null> {
  try {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const keys: string[] = [];
    for (let i = 0; i < style.length; i++) {
      const k = style[i];
      if (k) keys.push(k);
    }
    document.body.removeChild(el);
    return { hash: await hashList(keys), count: keys.length };
  } catch {
    return null;
  }
}

/** Collect speechSynthesis voices. */
export async function collectVoices(): Promise<HashCount | null> {
  try {
    if (!window.speechSynthesis) return null;

    const getVoices = (): SpeechSynthesisVoice[] =>
      window.speechSynthesis.getVoices();

    let voices = getVoices();
    if (voices.length === 0) {
      // Voices may load asynchronously
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const timer = setTimeout(() => resolve([]), 500);
        window.speechSynthesis.onvoiceschanged = () => {
          clearTimeout(timer);
          resolve(getVoices());
        };
        // Try again immediately in case they loaded during setup
        const immediate = getVoices();
        if (immediate.length > 0) {
          clearTimeout(timer);
          resolve(immediate);
        }
      });
    }

    if (voices.length === 0) return null;
    const names = voices.map((v) => `${v.name}:${v.lang}`);
    return { hash: await hashList(names), count: names.length };
  } catch {
    return null;
  }
}

/** Collect supported media MIME types. */
export async function collectMediaMime(): Promise<HashCount | null> {
  try {
    const video = document.createElement("video");
    const mimeTypes = [
      "video/mp4",
      'video/mp4; codecs="avc1.42E01E"',
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
      "video/ogg",
      'video/ogg; codecs="theora"',
      "video/webm",
      'video/webm; codecs="vp8"',
      'video/webm; codecs="vp9"',
      "audio/mp4",
      'audio/mp4; codecs="mp4a.40.2"',
      "audio/mpeg",
      "audio/ogg",
      'audio/ogg; codecs="vorbis"',
      "audio/wav",
      "audio/webm",
      'audio/webm; codecs="opus"',
    ];

    const supported: string[] = [];
    for (const mime of mimeTypes) {
      const result = video.canPlayType(mime);
      if (result) {
        supported.push(`${mime}:${result}`);
      }
    }

    return { hash: await hashList(supported), count: supported.length };
  } catch {
    return null;
  }
}

/** Font detection via rendering width comparison. */
export async function collectFonts(): Promise<HashCount | null> {
  try {
    const baseFonts = ["monospace", "sans-serif", "serif"] as const;
    const testFonts = [
      "Arial",
      "Arial Black",
      "Comic Sans MS",
      "Courier New",
      "Georgia",
      "Impact",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Palatino Linotype",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
      "Helvetica",
      "Helvetica Neue",
      "Segoe UI",
      "Roboto",
      "Ubuntu",
      "Cantarell",
      "Noto Sans",
    ];

    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";

    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = testSize;
    span.style.lineHeight = "normal";
    span.textContent = testString;
    document.body.appendChild(span);

    // Measure base widths
    const baseWidths: Record<string, number> = {};
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baseWidths[base] = span.offsetWidth;
    }

    const detected: string[] = [];
    for (const font of testFonts) {
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}', ${base}`;
        if (span.offsetWidth !== baseWidths[base]) {
          detected.push(font);
          break;
        }
      }
    }

    document.body.removeChild(span);
    return { hash: await hashList(detected), count: detected.length };
  } catch {
    return null;
  }
}
