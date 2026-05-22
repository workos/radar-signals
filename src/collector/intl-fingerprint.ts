/**
 * Intl fingerprint: hashes locale-dependent formatting output
 * that varies across OS/browser locale configurations.
 */

import { sha256Base64Url } from './crypto';

export const collectIntlFingerprint = async (): Promise<
  string | undefined
> => {
  try {
    const parts = [
      new Intl.NumberFormat().format(123456.789),
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(2000, 0, 1)),
      new Intl.ListFormat().format(['a', 'b', 'c']),
      new Intl.RelativeTimeFormat().format(-1, 'day'),
      Intl.DateTimeFormat().resolvedOptions().calendar,
      Intl.DateTimeFormat().resolvedOptions().numberingSystem,
    ];
    return await sha256Base64Url(parts.join('|'));
  } catch {
    return undefined;
  }
};
