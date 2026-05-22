/**
 * Cryptographic utilities for signal fingerprinting.
 * Uses the Web Crypto API (SubtleCrypto) available in browsers and workers.
 */

/** Convert an ArrayBuffer to a base64url-encoded string. */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 hash of a string, returned as base64url. */
export async function sha256Base64Url(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return bufferToBase64Url(buffer);
}

/** Sort a list of strings and hash the joined result. */
export async function hashList(items: string[]): Promise<string> {
  const sorted = [...items].sort();
  return sha256Base64Url(sorted.join(","));
}
