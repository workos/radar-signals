/**
 * Shared crypto utilities for signal fingerprinting.
 * All hashing uses SHA-256 with base64url encoding.
 */

export const canonicalizeList = (values: string[]): string[] =>
  Array.from(
    new Set(values.filter(Boolean).map((v) => v.trim().toLowerCase())),
  ).sort();

export const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const hashArray = Array.from(new Uint8Array(buffer));
  const base64 = btoa(String.fromCharCode(...hashArray));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sha256BufferBase64Url = async (
  buffer: BufferSource,
): Promise<string | undefined> => {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToBase64Url(hashBuffer);
  } catch {
    return undefined;
  }
};

export const sha256Base64Url = async (
  input: string,
): Promise<string | undefined> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return sha256BufferBase64Url(data);
};

export const hashList = async (
  values: string[],
): Promise<{ hash: string | undefined; count: number }> => {
  const canonical = canonicalizeList(values);
  const joined = canonical.join('\n');
  const hash = await sha256Base64Url(joined);

  return {
    hash,
    count: canonical.length,
  };
};
