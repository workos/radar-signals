/**
 * WebGL signals: vendor/renderer strings and a hash of GPU parameters.
 */

import { sha256Base64Url } from './crypto';

// Legacy WebKit context id; DOM typings omit it but it is valid at runtime.
declare global {
  interface HTMLCanvasElement {
    getContext(
      contextId: 'experimental-webgl',
      options?: WebGLContextAttributes,
    ): WebGLRenderingContext | null;
  }

  interface OffscreenCanvas {
    getContext(
      contextId: 'experimental-webgl',
      options?: WebGLContextAttributes,
    ): WebGLRenderingContext | null;
  }
}

const WEBGL_CONTEXT_PROBE_ORDER = [
  'webgl2',
  'webgl',
  'experimental-webgl',
] as const;

function webGlString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

function collectWebGlVendorRenderer(ctx: WebGLRenderingContext): {
  webGLRenderer: string | undefined;
  webGLVendor: string | undefined;
} {
  const extension = ctx.getExtension('WEBGL_debug_renderer_info');
  if (extension) {
    return {
      webGLVendor: webGlString(
        ctx.getParameter(extension.UNMASKED_VENDOR_WEBGL),
      ),
      webGLRenderer: webGlString(
        ctx.getParameter(extension.UNMASKED_RENDERER_WEBGL),
      ),
    };
  }

  return {
    webGLVendor: webGlString(ctx.getParameter(ctx.VENDOR)),
    webGLRenderer: webGlString(ctx.getParameter(ctx.RENDERER)),
  };
}

function getWebGlContextForProbeId(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  id: (typeof WEBGL_CONTEXT_PROBE_ORDER)[number],
): WebGLRenderingContext | WebGL2RenderingContext | null {
  // Narrow via separate calls so TS picks the correct overload for each
  // context string. The union type `HTMLCanvasElement | OffscreenCanvas`
  // causes `getContext('webgl2')` to resolve to `RenderingContext | null`
  // otherwise.
  if (canvas instanceof HTMLCanvasElement) {
    switch (id) {
      case 'webgl2':
        return canvas.getContext('webgl2');
      case 'webgl':
        return canvas.getContext('webgl');
      case 'experimental-webgl':
        return canvas.getContext('experimental-webgl');
      default:
        return null;
    }
  }

  // OffscreenCanvas
  switch (id) {
    case 'webgl2':
      return canvas.getContext('webgl2');
    case 'webgl':
      return canvas.getContext('webgl');
    case 'experimental-webgl':
      return canvas.getContext('experimental-webgl');
    default:
      return null;
  }
}

function tryGetWebGlContextFromCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): WebGLRenderingContext | null {
  for (const id of WEBGL_CONTEXT_PROBE_ORDER) {
    const ctx = getWebGlContextForProbeId(canvas, id);
    if (ctx !== null) {
      return ctx;
    }
  }

  return null;
}

export type MainThreadWebGlInfo = {
  webGLRenderer: string | undefined;
  webGLVendor: string | undefined;
  ctx: WebGLRenderingContext | null;
};

export function collectMainThreadWebGlInfo(): MainThreadWebGlInfo {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        const canvas = new OffscreenCanvas(256, 256);
        const ctx = tryGetWebGlContextFromCanvas(canvas);
        if (ctx) {
          return { ...collectWebGlVendorRenderer(ctx), ctx };
        }
      } catch {
        /* continue */
      }
    }

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = tryGetWebGlContextFromCanvas(canvas);
      if (ctx) {
        return { ...collectWebGlVendorRenderer(ctx), ctx };
      }
    }
  } catch {
    return { webGLRenderer: undefined, webGLVendor: undefined, ctx: null };
  }

  return { webGLRenderer: undefined, webGLVendor: undefined, ctx: null };
}

function normalizeGlParam(v: unknown): unknown {
  if (v instanceof Float32Array || v instanceof Int32Array) {
    return Array.from(v);
  }

  return v;
}

export const collectWebGLParamsHash = async (
  ctx: WebGLRenderingContext,
): Promise<string | undefined> => {
  try {
    const params = [
      ctx.getParameter(ctx.MAX_TEXTURE_SIZE),
      ctx.getParameter(ctx.MAX_RENDERBUFFER_SIZE),
      ctx.getParameter(ctx.MAX_VIEWPORT_DIMS),
      ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS),
      ctx.getParameter(ctx.MAX_VARYING_VECTORS),
      ctx.getParameter(ctx.MAX_VERTEX_UNIFORM_VECTORS),
      ctx.getParameter(ctx.MAX_FRAGMENT_UNIFORM_VECTORS),
      ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS),
      ctx.getParameter(ctx.ALIASED_LINE_WIDTH_RANGE),
      ctx.getParameter(ctx.ALIASED_POINT_SIZE_RANGE),
      ctx.getParameter(ctx.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      ctx.getParameter(ctx.SHADING_LANGUAGE_VERSION),
      ctx.getParameter(ctx.VERSION),
    ].map(normalizeGlParam);
    const extensions = (ctx.getSupportedExtensions() ?? []).sort();
    const payload = JSON.stringify({ params, extensions });
    return await sha256Base64Url(payload);
  } catch {
    return undefined;
  }
};
