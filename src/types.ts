/**
 * Signal types that match the server-side allowlists in
 * `packages/api-entities-zod/src/entities/radar-signals.ts`.
 *
 * Do NOT add, remove, or rename fields without updating the server-side
 * allowlists — payloads with unexpected keys are flagged.
 */

export type MediaPreferences = {
  colorScheme?: string;
  reducedMotion?: boolean;
  reducedTransparency?: boolean;
  contrast?: string;
  colorGamut?: string;
  hdr?: boolean;
  forcedColors?: boolean;
  invertedColors?: boolean;
};

export type Screen = {
  width?: number;
  height?: number;
  availWidth?: number;
  availHeight?: number;
  windowOuterWidth?: number;
  windowOuterHeight?: number;
  colorDepth?: number;
  pixelDepth?: number;
};

export type MinimalSurface = {
  windowFeaturesHash?: string;
  windowFeaturesCount?: number;
  cssKeysHash?: string;
  cssKeysCount?: number;
  voicesHash?: string;
  voicesLocalCount?: number;
  voicesRemoteCount?: number;
  voicesLanguagesCount?: number;
  mediaMimeHash?: string;
  mediaMimeCount?: number;
  fontsHash?: string;
  fontsCount?: number;
};

export type SignalsWorker =
  | {
      ok: true;
      webGLRenderer?: string;
      webGLVendor?: string;
      hardwareConcurrency?: number;
      platform?: string;
      userAgent?: string;
      language?: string;
    }
  | { ok: false; error?: string; timeout?: true };

export type Signals = {
  createdAtMs?: number;
  submittedAtMs?: number;
  timezone?: string;
  language?: string;
  hardwareConcurrency?: number;
  webdriver?: boolean;
  userAgent?: string;
  appVersion?: string;
  platform?: string;
  screen: Screen;
  rangeErrorLength?: number;
  evalStringLength?: number;
  puppeteerDetected?: boolean;
  puppeteerDocumentNotAvailable?: boolean;
  playwrightDetected?: boolean;
  phantomDetected?: boolean;
  nightmareDetected?: boolean;
  seleniumDetected?: boolean;
  webGLRenderer?: string;
  webGLVendor?: string;
  maxTouchPoints?: number;
  deviceMemory?: number;
  permissionsState?: PermissionState;
  notificationPermission?: NotificationPermission;
  devicePixelRatio?: number;
  pluginsLength?: number;
  mimeTypesCount?: number;
  documentHidden?: boolean;
  documentVisibilityState?: DocumentVisibilityState;
  minimalSurface?: MinimalSurface;
  worker: SignalsWorker;
  canvasHash?: string;
  audioHash?: string;
  webGLParamsHash?: string;
  mathHash?: string;
  intlHash?: string;
  mediaPreferences?: MediaPreferences;
};

export interface RadarInitOptions {
  /** WorkOS client ID (publishable, safe for browser). */
  clientId: string;
  /** Override API base URL. Defaults to `https://api.workos.com`. */
  apiUrl?: string;
}
