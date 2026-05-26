/**
 * Web Worker source code as a string constant.
 * This code runs inside a Blob URL worker to collect WebGL parameters
 * and worker-thread navigator info from a fresh context.
 *
 * The worker creates an OffscreenCanvas (if available), gets a WebGL context,
 * collects renderer/vendor, and also reports hardwareConcurrency, platform,
 * userAgent, and language from the worker's navigator.
 */

export const WORKER_SOURCE = `
"use strict";

self.onmessage = function() {
  try {
    var renderer = undefined;
    var vendor = undefined;

    if (typeof OffscreenCanvas !== "undefined") {
      try {
        var canvas = new OffscreenCanvas(1, 1);
        var gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          try {
            var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || undefined;
              vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || undefined;
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    self.postMessage({
      ok: true,
      webGLRenderer: renderer,
      webGLVendor: vendor,
      hardwareConcurrency: typeof navigator !== "undefined" ? navigator.hardwareConcurrency : undefined,
      platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      language: typeof navigator !== "undefined" ? navigator.language : undefined
    });
  } catch (e) {
    self.postMessage({ ok: false, error: String(e) });
  }
};
`;
