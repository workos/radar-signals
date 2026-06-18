# @workos/radar-signals

Collect browser signals for [WorkOS Radar](https://workos.com/radar) fraud and bot detection.

`@workos/radar-signals` runs in the browser, loads a signal collection script from the WorkOS CDN, and returns a correlation token you pass with your authentication calls. WorkOS Radar uses these signals server-side to evaluate risk.

## Installation

```bash
npm install @workos/radar-signals
```

## Quick start

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

Then call `getToken()` from any child component when you need the correlation token:

```tsx
import { useRadarToken } from '@workos/radar-signals/react';

function LoginForm() {
  const { getToken } = useRadarToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = await getToken();
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ radar_token: token }),
    });
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## How it works

1. The library loads a signal collection script from the WorkOS CDN
2. The CDN script collects device and environment signals and submits them to the WorkOS API
3. `getToken()` returns the correlation token — if collection is still in-flight, it waits for completion
4. Pass the token server-side to WorkOS Radar for risk evaluation

The library is **fail-open**: `getToken()` always returns a value, even if the CDN script fails to load. Server-side Radar handles missing signals gracefully.

## React API

Requires React 18 or later. Import from `@workos/radar-signals/react`.

### `<RadarSignalsProvider>`

Initializes Radar and provides the token to descendant components via context.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | `string` | Yes | Your WorkOS client ID (publishable, safe for browser use) |
| `apiUrl` | `string` | No | Override the API base URL (defaults to `https://api.workos.com`) |

### `useRadarToken()`

Returns `{ getToken, getTokenSync }` from the nearest `RadarSignalsProvider`.

- **`getToken()`** — returns the token after collection completes (async)
- **`getTokenSync()`** — returns the token immediately; for redirect/OAuth flows where you're about to navigate away

### `useRadarSignals(options)`

Standalone hook that creates its own Radar instance — no provider needed. Accepts the same options as `RadarSignalsProvider`. Returns `{ getToken, getTokenSync }`.

```tsx
import { useRadarSignals } from '@workos/radar-signals/react';

function LoginForm() {
  const { getToken, getTokenSync } = useRadarSignals({
    clientId: 'client_01ABC...',
  });
  // ...
}
```

## Vanilla JS

If you're not using React, the `WorkOSRadar` class provides the same functionality.

```ts
import { WorkOSRadar } from '@workos/radar-signals';

const radar = WorkOSRadar.init({ clientId: 'client_01ABC...' });

const token = await radar.getToken();
```

### `WorkOSRadar.init(options)`

Creates a new Radar instance and loads the CDN collectors script.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clientId` | `string` | Yes | Your WorkOS client ID (publishable, safe for browser use) |
| `apiUrl` | `string` | No | Override the API base URL (defaults to `https://api.workos.com`) |

### `radar.getToken()`

Returns the correlation token after signals have been collected and submitted. If the CDN script is still loading, the promise resolves once complete.

### `radar.getTokenSync()`

Returns the token synchronously. Use this for OAuth or redirect flows where you're about to navigate away. If you need to wait for signal collection to complete, use `getToken()` instead.

## Script tag usage

For environments without a bundler, load the IIFE build via a `<script>` tag.

```html
<script src="https://unpkg.com/@workos/radar-signals/dist/workos-radar-signals.global.js"></script>
<script>
  var radar = WorkOSRadar.init({ clientId: 'client_01ABC...' });
  radar.getToken().then(function (token) {
    // pass token with your auth request
  });
</script>
```

## License

MIT
