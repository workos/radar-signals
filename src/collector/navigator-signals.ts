/**
 * Collect navigator, screen, device, and permission signals.
 */

interface NavigatorSignals {
  timezone: string | null;
  language: string | null;
  hardwareConcurrency: number | null;
  webdriver: boolean | null;
  userAgent: string | null;
  appVersion: string | null;
  platform: string | null;
  maxTouchPoints: number | null;
  deviceMemory: number | null;
  devicePixelRatio: number | null;
  documentHidden: boolean | null;
  documentVisibilityState: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  screenAvailWidth: number | null;
  screenAvailHeight: number | null;
  screenColorDepth: number | null;
  screenPixelDepth: number | null;
  screenOrientationType: string | null;
  screenOrientationAngle: number | null;
  permissionCamera: string | null;
  permissionMicrophone: string | null;
  permissionNotifications: string | null;
  permissionGeolocation: string | null;
  plugins: string | null;
  mimeTypes: string | null;
}

function tryGet<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

async function queryPermission(name: string): Promise<string | null> {
  try {
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });
    return status.state;
  } catch {
    return null;
  }
}

function collectPlugins(): string | null {
  try {
    const list: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const p = navigator.plugins[i];
      if (p) list.push(p.name);
    }
    return list.join(",");
  } catch {
    return null;
  }
}

function collectMimeTypes(): string | null {
  try {
    const list: string[] = [];
    for (let i = 0; i < navigator.mimeTypes.length; i++) {
      const m = navigator.mimeTypes[i];
      if (m) list.push(m.type);
    }
    return list.join(",");
  } catch {
    return null;
  }
}

export async function collectNavigatorSignals(): Promise<NavigatorSignals> {
  const [
    permissionCamera,
    permissionMicrophone,
    permissionNotifications,
    permissionGeolocation,
  ] = await Promise.all([
    queryPermission("camera"),
    queryPermission("microphone"),
    queryPermission("notifications"),
    queryPermission("geolocation"),
  ]);

  const nav = navigator as Navigator & { deviceMemory?: number };
  const scr = screen;
  const orient = tryGet(() => scr.orientation, null);

  return {
    timezone: tryGet(
      () => Intl.DateTimeFormat().resolvedOptions().timeZone,
      null,
    ),
    language: tryGet(() => navigator.language, null),
    hardwareConcurrency: tryGet(() => navigator.hardwareConcurrency, null),
    webdriver: tryGet(() => navigator.webdriver, null),
    userAgent: tryGet(() => navigator.userAgent, null),
    appVersion: tryGet(() => navigator.appVersion, null),
    platform: tryGet(() => navigator.platform, null),
    maxTouchPoints: tryGet(() => navigator.maxTouchPoints, null),
    deviceMemory: tryGet(() => nav.deviceMemory ?? null, null),
    devicePixelRatio: tryGet(() => window.devicePixelRatio, null),
    documentHidden: tryGet(() => document.hidden, null),
    documentVisibilityState: tryGet(() => document.visibilityState, null),
    screenWidth: tryGet(() => scr.width, null),
    screenHeight: tryGet(() => scr.height, null),
    screenAvailWidth: tryGet(() => scr.availWidth, null),
    screenAvailHeight: tryGet(() => scr.availHeight, null),
    screenColorDepth: tryGet(() => scr.colorDepth, null),
    screenPixelDepth: tryGet(() => scr.pixelDepth, null),
    screenOrientationType: orient ? orient.type : null,
    screenOrientationAngle: orient ? orient.angle : null,
    permissionCamera,
    permissionMicrophone,
    permissionNotifications,
    permissionGeolocation,
    plugins: collectPlugins(),
    mimeTypes: collectMimeTypes(),
  };
}
