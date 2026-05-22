/**
 * Web Worker source code as a string constant.
 * This code runs inside a Blob URL worker to collect WebGL parameters
 * from a fresh context without blocking the main thread.
 *
 * The worker creates an OffscreenCanvas (if available), gets a WebGL context,
 * collects parameters, and posts the result back.
 */

export const WORKER_SOURCE = `
"use strict";

var WEBGL_PARAMS = [
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
  0x84e8  // MAX_RENDERBUFFER_SIZE
];

self.onmessage = function() {
  try {
    var canvas;
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(1, 1);
    } else {
      self.postMessage({ ok: false, error: "No OffscreenCanvas" });
      return;
    }

    var gl = canvas.getContext("webgl");
    if (!gl) {
      self.postMessage({ ok: false, error: "No WebGL context" });
      return;
    }

    var renderer = null;
    var vendor = null;
    try {
      var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    } catch (e) {}

    var params = [];
    for (var i = 0; i < WEBGL_PARAMS.length; i++) {
      params.push(String(gl.getParameter(WEBGL_PARAMS[i])));
    }

    var extensions = gl.getSupportedExtensions();
    if (extensions) {
      params.push(extensions.sort().join(","));
    }

    self.postMessage({
      ok: true,
      renderer: renderer,
      vendor: vendor,
      paramsString: params.join("|")
    });
  } catch (e) {
    self.postMessage({ ok: false, error: String(e) });
  }
};
`;
