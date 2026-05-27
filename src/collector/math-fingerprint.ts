/**
 * Math fingerprint: hashes the results of transcendental math functions
 * that vary subtly between JS engines and hardware.
 */

import { sha256Base64Url } from './crypto';

export const collectMathFingerprint = async (): Promise<
  string | undefined
> => {
  try {
    const values = [
      Math.acos(0.123456789),
      Math.acosh(1e308),
      Math.asin(0.123456789),
      Math.atanh(0.5),
      Math.cbrt(Math.PI),
      Math.cbrt(13),
      Math.cosh(21),
      Math.expm1(1),
      Math.log1p(10),
      Math.log1p(0.5),
      Math.sinh(1),
      Math.tan(-1e300),
    ];
    return await sha256Base64Url(values.join(','));
  } catch {
    return undefined;
  }
};
