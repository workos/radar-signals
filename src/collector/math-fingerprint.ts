/**
 * Math function fingerprinting.
 * Different JS engines return slightly different values for trig/log functions.
 */

import { sha256Base64Url } from "./crypto";

export async function collectMathFingerprint(): Promise<string | null> {
  try {
    const values = [
      Math.acos(0.5),
      Math.acosh(2),
      Math.asin(0.5),
      Math.asinh(1),
      Math.atan(1),
      Math.atanh(0.5),
      Math.atan2(1, 2),
      Math.cbrt(2),
      Math.cos(1),
      Math.cosh(1),
      Math.exp(1),
      Math.expm1(1),
      Math.log(2),
      Math.log1p(1),
      Math.log2(Math.E),
      Math.log10(2),
      Math.sin(1),
      Math.sinh(1),
      Math.sqrt(2),
      Math.tan(1),
      Math.tanh(1),
    ];
    return sha256Base64Url(values.map(String).join(","));
  } catch {
    return null;
  }
}
