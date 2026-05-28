# @workos/radar-signals

Collect browser signals for [WorkOS Radar](https://workos.com/radar) fraud and bot detection.

This library runs in the browser, collects device fingerprinting and automation detection signals, submits them to the WorkOS API, and returns a correlation token you pass with your authentication calls.

## Installation

```bash
npm install @workos/radar-signals
```

## Quick start

```ts
import { WorkOSRadar } from '@workos/radar-signals';

// Initialize — starts collecting signals immediately
const radar = WorkOSRadar.init({ clientId: 'client_01ABC...' });

// Get the token when you're ready to authenticate
const token = await radar.getToken();

// Pass the token with your auth API call
await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password, radar_token: token }),
});
```

## How it works

1. `init()` installs a puppeteer detection trap and kicks off signal collection in parallel
2. Collected signals are automatically POSTed to the WorkOS API
3. `getToken()` returns the correlation ID — if collection is still in-flight, it awaits completion
4. The token is passed server-side to WorkOS Radar for risk evaluation

The library is **fail-open**: `getToken()` always returns a token, even if the API call fails. Server-side Radar handles missing signals gracefully.

## API

### `WorkOSRadar.init(options)`

Creates a new Radar instance and immediately starts signal collection.

```ts
const radar = WorkOSRadar.init({
  clientId: 'client_01ABC...',  // WorkOS client ID (publishable, safe for browser use)
  apiUrl: 'https://api.workos.com', // Optional — override the API base URL
});
```

Returns a `WorkOSRadar` instance.

### `radar.getToken(): Promise<string>`

Returns the correlation token after signals have been collected and submitted. If collection is still in progress, the promise resolves once it completes.

```ts
const token = await radar.getToken();
```

### `radar.getTokenSync(): string`

Returns the token synchronously. If signals haven't been submitted yet, flushes them via `fetch` with `keepalive: true` (sendBeacon-style). Use this for OAuth or redirect flows where you're about to navigate away from the page.

```ts
const token = radar.getTokenSync();
window.location.href = `/auth/redirect?radar_token=${token}`;
```

### `radar.refresh(): Promise<string>`

Re-collects signals and returns a new token. Use this for subsequent auth attempts on the same page (e.g., after a failed login).

```ts
const newToken = await radar.refresh();
```

### `radar.destroy()`

Cleans up the instance: restores any patched DOM prototypes and resolves pending promises. Idempotent.

```ts
radar.destroy();
```

## React

The library provides React bindings at `@workos/radar-signals/react`. React 18+ is required.

### Provider pattern

Wrap your app (or auth subtree) in `RadarSignalsProvider`. Signal collection starts automatically on mount.

```tsx
import { RadarSignalsProvider } from '@workos/radar-signals/react';

function App() {
  return (
    <RadarSignalsProvider clientId="client_01ABC...">
      <LoginForm />
    </RadarSignalsProvider>
  );
}
```

Retrieve the token from any descendant component:

```tsx
import { useRadarToken } from '@workos/radar-signals/react';

function LoginForm() {
  const { getToken } = useRadarToken();

  const handleSubmit = async (email: string, password: string) => {
    const token = await getToken();
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, radar_token: token }),
    });
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Standalone hook

For cases where a context provider isn't practical, use `useRadarSignals` directly:

```tsx
import { useRadarSignals } from '@workos/radar-signals/react';

function LoginForm() {
  const { getToken, getTokenSync } = useRadarSignals({ clientId: 'client_01ABC...' });
  // ...
}
```

## Script tag

For environments that don't use a JavaScript bundler, load the library via a `<script>` tag. The IIFE build exposes `window.WorkOSRadar`.

```html
<script src="https://unpkg.com/@workos/radar-signals/dist/workos-radar-signals.global.js"></script>
<script>
  var radar = WorkOSRadar.init({ clientId: 'client_01ABC...' });
  radar.getToken().then(function (token) {
    // pass token with your auth request
  });
</script>
```

## Content Security Policy

The library creates an inline Web Worker via a Blob URL for off-main-thread WebGL signal collection. If your site uses a Content Security Policy, add `blob:` to the `worker-src` directive:

```
worker-src 'self' blob:;
```

If the CSP blocks the worker, the library degrades gracefully — main-thread WebGL data is still collected, and the worker reports an error state.

## License

MIT
