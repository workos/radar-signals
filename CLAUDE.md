# CLAUDE.md

## What this repo is

`@workos/radar-signals` is a thin browser SDK for [WorkOS Radar](https://workos.com/radar) fraud and bot detection. It loads a signal collection script from the WorkOS CDN at runtime, which collects device and environment signals, submits them to the WorkOS API, and provides a correlation token. The token gets passed with authentication calls so WorkOS Radar can evaluate risk server-side.

Published to npm as `@workos/radar-signals`. The package is framework-agnostic with optional React bindings at `@workos/radar-signals/react`.

## How to integrate

### React (recommended)

Wrap your app or auth subtree in `RadarSignalsProvider`. The CDN script loads on mount.

```tsx
import { RadarSignalsProvider, useRadarToken } from '@workos/radar-signals/react';

function App() {
  return (
    <RadarSignalsProvider clientId="client_...">
      <LoginForm />
    </RadarSignalsProvider>
  );
}

function LoginForm() {
  const { getToken } = useRadarToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = await getToken();
    // Pass token with your auth request
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ radar_token: token }),
    });
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

A standalone `useRadarSignals(options)` hook is also available if you don't want to use the provider pattern.

### Vanilla JS

```ts
import { WorkOSRadar } from '@workos/radar-signals';

const radar = WorkOSRadar.init({ clientId: 'client_...' });
const token = await radar.getToken();
// Pass token with your auth request
```

### Script tag

```html
<script src="https://unpkg.com/@workos/radar-signals/dist/workos-radar-signals.global.js"></script>
<script>
  var radar = WorkOSRadar.WorkOSRadar.init({ clientId: 'client_...' });
  radar.getToken().then(function (token) {
    // pass token with your auth request
  });
</script>
```

## Public API

| Method | Description |
|--------|-------------|
| `WorkOSRadar.init(options)` | Creates a Radar instance and loads the CDN collectors script. Accepts `clientId` (required) and `apiUrl` (optional, defaults to `https://api.workos.com`). |
| `radar.getToken()` | Returns the correlation token (async). Waits for the CDN script to load and collection to complete. |
| `radar.getTokenSync()` | Returns the token synchronously. For redirect/OAuth flows where you're about to navigate away. |

React hooks (`useRadarToken`, `useRadarSignals`) return `{ getToken, getTokenSync }`.

## Key behavior

- **Fail-open**: `getToken()` always resolves with a value (empty string if the CDN script fails to load). Server-side Radar handles missing signals gracefully.
- **CDN-loaded**: Signal collection logic is loaded from `https://js.workos.com/radar/v1/collectors.js` at runtime — it is not bundled in this package.
- **Requires React 18+** for React bindings.
- **No runtime dependencies** — the package has zero production dependencies.

## Commands

- `npm run build` — Build ESM, CJS, and IIFE outputs via tsup
- `npm run dev` — Watch mode build
- `npm test` — Run tests with Vitest
- `npm run test:watch` — Watch mode tests
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run clean` — Remove the `dist/` directory
