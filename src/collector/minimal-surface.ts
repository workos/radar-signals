/**
 * Minimal surface signals: window features, CSS property keys, speech
 * synthesis voices, media MIME support, and installed font detection.
 */

import type { MinimalSurface } from '../types';
import { hashList } from './crypto';

const PROBE_FONTS = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Georgia',
  'Garamond',
  'Courier New',
  'Brush Script MT',
  'Palatino Linotype',
  'Lucida Console',
  'Comic Sans MS',
  'Impact',
  'Lucida Sans Unicode',
  'Century Gothic',
  'Segoe UI',
  'Cambria',
  'Calibri',
  'Consolas',
  'Menlo',
  'Monaco',
  'SF Pro',
  'Roboto',
  'Noto Sans',
  'Ubuntu',
  'Cantarell',
  'DejaVu Sans',
];

const collectFonts = async (): Promise<{
  fontsHash: string | undefined;
  fontsCount: number;
}> => {
  if (!document.body) {
    return { fontsHash: undefined, fontsCount: 0 };
  }

  const span = document.createElement('span');

  try {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmMwWLli10Oo#@';
    const testSize = '72px';
    // Neutralize inherited host CSS so measurements are deterministic across apps.
    span.style.cssText = [
      'all: initial',
      'display: inline-block',
      'box-sizing: content-box',
      'position: absolute',
      'left: -9999px',
      'top: 0',
      'margin: 0',
      'padding: 0',
      'border: 0',
      'line-height: normal',
      'letter-spacing: normal',
      'word-spacing: normal',
      'font-style: normal',
      'font-weight: normal',
      'font-variant: normal',
      'text-transform: none',
      'text-decoration: none',
      'vertical-align: baseline',
      'white-space: nowrap',
      `font-size: ${testSize}`,
    ].join('; ');
    span.textContent = testString;
    document.body.appendChild(span);

    const baselines = new Map<string, { w: number; h: number }>();
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baselines.set(base, {
        w: span.offsetWidth,
        h: span.offsetHeight,
      });
    }

    const detected: string[] = [];
    for (const font of PROBE_FONTS) {
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}', ${base}`;
        const baseline = baselines.get(base);
        if (
          baseline &&
          (span.offsetWidth !== baseline.w || span.offsetHeight !== baseline.h)
        ) {
          detected.push(font);
          break;
        }
      }
    }

    const { hash, count } = await hashList(detected);
    return { fontsHash: hash, fontsCount: count };
  } catch {
    return { fontsHash: undefined, fontsCount: 0 };
  } finally {
    try {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    } catch {
      /* ignore cleanup failures */
    }
  }
};

const collectWindowFeatures = async (): Promise<{
  windowFeaturesHash: string | undefined;
  windowFeaturesCount: number | undefined;
}> => {
  try {
    const keys = Object.getOwnPropertyNames(window);
    const { hash, count } = await hashList(keys);

    return {
      windowFeaturesHash: hash,
      windowFeaturesCount: count,
    };
  } catch {
    return {
      windowFeaturesHash: undefined,
      windowFeaturesCount: undefined,
    };
  }
};

const collectCssKeys = async (): Promise<{
  cssKeysHash: string | undefined;
  cssKeysCount: number | undefined;
}> => {
  try {
    if (!document.body) {
      return { cssKeysHash: undefined, cssKeysCount: 0 };
    }

    const el = document.createElement('div');
    document.body.appendChild(el);

    const style = window.getComputedStyle(el);
    const keys = Array.from(style);

    document.body.removeChild(el);

    const { hash, count } = await hashList(keys);

    return {
      cssKeysHash: hash,
      cssKeysCount: count,
    };
  } catch {
    return {
      cssKeysHash: undefined,
      cssKeysCount: undefined,
    };
  }
};

const collectVoices = async (): Promise<{
  voicesHash: string | undefined;
  voicesLocalCount: number | undefined;
  voicesRemoteCount: number | undefined;
  voicesLanguagesCount: number | undefined;
}> => {
  try {
    if (!('speechSynthesis' in window)) {
      return {
        voicesHash: undefined,
        voicesLocalCount: 0,
        voicesRemoteCount: 0,
        voicesLanguagesCount: 0,
      };
    }

    // Safari sometimes loads voices async
    await new Promise<void>((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        return resolve();
      }

      const cleanup = () => {
        speechSynthesis.onvoiceschanged = null;
      };

      speechSynthesis.onvoiceschanged = () => {
        cleanup();
        resolve();
      };

      setTimeout(() => {
        cleanup();
        resolve();
      }, 500); // fallback
    });

    const voices = speechSynthesis.getVoices();

    const local = voices.filter((v) => v.localService).map((v) => v.name);
    const remote = voices.filter((v) => !v.localService).map((v) => v.name);
    const languages = voices.map((v) => v.lang);

    const all = [...local, ...remote, ...languages];

    const { hash } = await hashList(all);

    return {
      voicesHash: hash,
      voicesLocalCount: new Set(local).size,
      voicesRemoteCount: new Set(remote).size,
      voicesLanguagesCount: new Set(languages).size,
    };
  } catch {
    return {
      voicesHash: undefined,
      voicesLocalCount: undefined,
      voicesRemoteCount: undefined,
      voicesLanguagesCount: undefined,
    };
  }
};

const TEST_MIME_TYPES = [
  'audio/aac',
  'audio/mpeg',
  'audio/ogg; codecs="vorbis"',
  'audio/wav; codecs="1"',
  'audio/x-m4a',
  'video/mp4; codecs="avc1.42E01E"',
  'video/webm; codecs="vp8"',
  'video/webm; codecs="vp9"',
  'video/x-matroska',
];

const collectMediaMime = async (): Promise<{
  mediaMimeHash: string | undefined;
  mediaMimeCount: number | undefined;
}> => {
  try {
    const audio = document.createElement('audio');
    const video = document.createElement('video');

    const supported: string[] = [];

    for (const type of TEST_MIME_TYPES) {
      const audioSupport = audio.canPlayType(type);
      const videoSupport = video.canPlayType(type);

      if (audioSupport || videoSupport) {
        supported.push(type);
      }
    }

    const { hash, count } = await hashList(supported);

    return {
      mediaMimeHash: hash,
      mediaMimeCount: count,
    };
  } catch {
    return {
      mediaMimeHash: undefined,
      mediaMimeCount: undefined,
    };
  }
};

export const collectMinimalSurface = async (): Promise<MinimalSurface> => {
  const [windowFeatures, cssKeys, voices, mediaMime, fonts] = await Promise.all(
    [
      collectWindowFeatures(),
      collectCssKeys(),
      collectVoices(),
      collectMediaMime(),
      collectFonts(),
    ],
  );

  return {
    ...windowFeatures,
    ...cssKeys,
    ...voices,
    ...mediaMime,
    ...fonts,
  };
};
