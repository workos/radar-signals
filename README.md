# @workos/radar-signals

Browser signals collector for [WorkOS Radar](https://workos.com/radar).

## Installation

```bash
npm install @workos/radar-signals
```

## Usage

### ES Modules / CommonJS

```ts
import { WorkOSRadar } from "@workos/radar-signals";

const radar = WorkOSRadar.init({ clientId: "client_..." });
const token = await radar.getToken();
```

### React

```tsx
import { useRadarSignals } from "@workos/radar-signals/react";
```

### Script tag (IIFE)

```html
<script src="https://unpkg.com/@workos/radar-signals/dist/workos-radar-signals.global.js"></script>
<script>
  // Available as window.WorkOSRadar
</script>
```

## License

MIT
