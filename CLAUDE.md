# CLAUDE.md

## What this repo is

`@workos/radar-signals` is a standalone browser library that collects device fingerprinting and automation detection signals for [WorkOS Radar](https://workos.com/radar). It collects signals, POSTs them to the WorkOS API, and returns a correlation token the developer passes with auth calls.

Published to npm as `@workos/radar-signals`. The package is framework-agnostic with optional React bindings at `@workos/radar-signals/react`.

## Commands

- `npm run build` — Build ESM, CJS, and IIFE outputs via tsup
- `npm run dev` — Watch mode build
- `npm test` — Run tests with Vitest
- `npm run test:watch` — Watch mode tests
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run clean` — Remove the `dist/` directory

## Project structure

```
src/
  index.ts                    — WorkOSRadar class (main entry point)
  react.ts                    — React entry point (re-exports from react/)
  types.ts                    — Public TypeScript types (Signals, RadarInitOptions, etc.)
  collector/
    index.ts                  — Orchestrator: runs all collectors in parallel via Promise.all
    navigator-signals.ts      — Browser navigator, screen, device info
    bot-detectors.ts          — Selenium, Playwright, Phantom, Nightmare detection
    puppeteer-detector.ts     — querySelector stack-trace trap for Puppeteer
    canvas-fingerprint.ts     — Canvas rendering hash
    audio-fingerprint.ts      — OfflineAudioContext fingerprint hash
    webgl-signals.ts          — WebGL vendor/renderer and params hash
    math-fingerprint.ts       — Transcendental math function hash
    intl-fingerprint.ts       — Intl locale-dependent formatting hash
    media-preferences.ts      — CSS media query preferences
    minimal-surface.ts        — Window features, CSS keys, voices, MIME types, fonts
    crypto.ts                 — SHA-256 hashing utilities (sha256Base64Url, hashList)
  worker/
    inline-worker.ts          — Creates and runs a Blob URL Web Worker
    worker-source.ts          — Worker source code embedded as a string constant
  api/
    client.ts                 — POST signals to /radar/signals, beacon fallback
  react/
    index.ts                  — React sub-export barrel
    radar-signals-provider.tsx — <RadarSignalsProvider> context + useRadarToken hook
    use-radar-signals.ts      — Standalone useRadarSignals hook (no context)
```

Tests live alongside source code at `src/*/__tests__/*.test.ts(x)`.

## Architecture notes

- **Fail-open**: `getToken()` always returns a token even if the API call fails. Server-side Radar handles missing signals.
- **Parallel collection**: All signal collectors run concurrently via `Promise.all`. The orchestrator in `collector/index.ts` assembles them into a single `Signals` object.
- **Puppeteer detection**: Patches `querySelector`/`querySelectorAll` on Document and Element prototypes to capture stack traces and match Puppeteer patterns. Has a 60-second safety timeout that auto-restores prototypes if `destroy()` is never called.
- **Inline worker**: Worker source code is embedded as a string in `worker-source.ts` and created via `new Worker(URL.createObjectURL(new Blob([source])))`. No external worker files. Requires `worker-src blob:` in CSP.
- **Signal shape compatibility**: The `Signals` type must stay compatible with server-side allowlists in the WorkOS monorepo (`packages/api-entities-zod/src/entities/radar-signals.ts`). Do not add, remove, or rename signal fields without coordinating with the API team.

## Build outputs

tsup produces three output formats:

- `dist/index.mjs` / `dist/index.cjs` — ESM and CJS for bundlers
- `dist/react.mjs` / `dist/react.cjs` — React bindings
- `dist/workos-radar-signals.global.js` — Minified IIFE for `<script>` tags (exposes `window.WorkOSRadar`)
- `dist/*.d.ts` / `dist/*.d.cts` — TypeScript declarations

## Code conventions

- All fingerprint hashes use SHA-256 encoded as base64url via the shared `sha256Base64Url` utility in `collector/crypto.ts`.
- The `WorkOSRadar` class uses a state machine: `collecting → sending → ready | error`.
- React hooks use lazy ref initialization (`if (ref.current === null)`) to create the Radar instance during render, before effects fire. This ensures the instance is ready for child component effects.
- Single runtime dependency: `ulidx` (for generating correlation IDs).
