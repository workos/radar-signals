/**
 * Collects CSS media query preferences (color scheme, motion, contrast, etc.).
 */

import type { MediaPreferences } from '../types';

const matchMediaQuery = (q: string): boolean | undefined => {
  const mql = window.matchMedia?.(q);
  return mql ? mql.matches : undefined;
};

function detectColorScheme(): string | undefined {
  const dark = matchMediaQuery('(prefers-color-scheme: dark)');
  const light = matchMediaQuery('(prefers-color-scheme: light)');

  if (dark === undefined && light === undefined) {
    return undefined;
  }

  if (dark) {
    return 'dark';
  }

  if (light) {
    return 'light';
  }

  return 'no-preference';
}

function detectContrast(): string | undefined {
  const more = matchMediaQuery('(prefers-contrast: more)');
  const less = matchMediaQuery('(prefers-contrast: less)');
  const forced = matchMediaQuery('(prefers-contrast: forced)');

  if (more === undefined && less === undefined && forced === undefined) {
    return undefined;
  }

  if (more) {
    return 'more';
  }

  if (less) {
    return 'less';
  }

  if (forced) {
    return 'forced';
  }

  return 'no-preference';
}

function detectColorGamut(): string | undefined {
  const rec2020 = matchMediaQuery('(color-gamut: rec2020)');
  const p3 = matchMediaQuery('(color-gamut: p3)');
  const srgb = matchMediaQuery('(color-gamut: srgb)');

  if (rec2020 === undefined && p3 === undefined && srgb === undefined) {
    return undefined;
  }

  if (rec2020) {
    return 'rec2020';
  }

  if (p3) {
    return 'p3';
  }

  return 'srgb';
}

export const collectMediaPreferences = (): MediaPreferences => ({
  colorScheme: detectColorScheme(),
  reducedMotion: matchMediaQuery('(prefers-reduced-motion: reduce)'),
  reducedTransparency: matchMediaQuery(
    '(prefers-reduced-transparency: reduce)',
  ),
  contrast: detectContrast(),
  colorGamut: detectColorGamut(),
  hdr: matchMediaQuery('(dynamic-range: high)'),
  forcedColors: matchMediaQuery('(forced-colors: active)'),
  invertedColors: matchMediaQuery('(inverted-colors: inverted)'),
});
