/**
 * WebGL signal collection (main-thread portion).
 * Collects renderer/vendor from WEBGL_debug_renderer_info
 * and hashes a set of WebGL context parameters.
 */

import { sha256Base64Url } from "./crypto";

interface WebGLSignals {
  webGLRenderer: string | null;
  webGLVendor: string | null;
  webGLParamsHash: string | null;
}

const WEBGL_PARAMS: number[] = [
  0x0d33, // MAX_TEXTURE_SIZE
  0x0d3a, // MAX_VIEWPORT_DIMS
  0x8869, // MAX_VERTEX_ATTRIBS
  0x8dfb, // MAX_VERTEX_UNIFORM_VECTORS
  0x8dfc, // MAX_VARYING_VECTORS
  0x8b4d, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
  0x8b4c, // MAX_VERTEX_TEXTURE_IMAGE_UNITS
  0x8872, // MAX_TEXTURE_IMAGE_UNITS
  0x8dfd, // MAX_FRAGMENT_UNIFORM_VECTORS
  0x0b71, // MAX_CUBE_MAP_TEXTURE_SIZE
  0x84e8, // MAX_RENDERBUFFER_SIZE
];

function getWebGLContext(): WebGLRenderingContext | null {
  try {
    const canvas = document.createElement("canvas");
    return (
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext(
        "experimental-webgl",
      ) as WebGLRenderingContext | null)
    );
  } catch {
    return null;
  }
}

export async function collectWebGLSignals(): Promise<WebGLSignals> {
  const gl = getWebGLContext();
  if (!gl) {
    return { webGLRenderer: null, webGLVendor: null, webGLParamsHash: null };
  }

  let webGLRenderer: string | null = null;
  let webGLVendor: string | null = null;

  try {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      webGLRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      webGLVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }
  } catch {
    // Extension not available
  }

  let webGLParamsHash: string | null = null;
  try {
    const values: string[] = [];
    for (const param of WEBGL_PARAMS) {
      const val = gl.getParameter(param);
      values.push(String(val));
    }

    // Also collect supported extensions
    const extensions = gl.getSupportedExtensions();
    if (extensions) {
      values.push(extensions.sort().join(","));
    }

    webGLParamsHash = await sha256Base64Url(values.join("|"));
  } catch {
    // Hash collection failed
  }

  return { webGLRenderer, webGLVendor, webGLParamsHash };
}
