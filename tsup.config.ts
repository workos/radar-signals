import { defineConfig } from "tsup";

export default defineConfig([
  // ESM and CJS builds for the main entry
  {
    entry: {
      index: "src/index.ts",
      react: "src/react.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : ".cjs",
      };
    },
    external: ["react"],
  },
  // IIFE build for script tag usage
  {
    entry: { "workos-radar-signals.global": "src/global.ts" },
    format: ["iife"],
    outExtension() {
      return { js: ".js" };
    },
    minify: true,
    sourcemap: true,
  },
]);
