/** Configuration options for initializing WorkOS Radar. */
export interface RadarInitOptions {
  /** The publishable client ID from the WorkOS dashboard. */
  clientId: string;
  /** Override the WorkOS API base URL (default: https://api.workos.com). */
  apiUrl?: string;
}

/** Hash + count pair used for minimal surface signals. */
export interface HashCount {
  hash: string;
  count: number;
}

/** Media preference signals from CSS matchMedia queries. */
export interface MediaPreferences {
  prefersColorScheme: string | null;
  prefersReducedMotion: string | null;
  prefersReducedTransparency: string | null;
  prefersContrast: string | null;
  forcedColors: string | null;
  invertedColors: string | null;
  prefersReducedData: string | null;
  colorGamut: string | null;
}

/** The full signal payload sent to the WorkOS API. */
export interface Signals {
  // Navigator / device
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

  // Screen
  screenWidth: number | null;
  screenHeight: number | null;
  screenAvailWidth: number | null;
  screenAvailHeight: number | null;
  screenColorDepth: number | null;
  screenPixelDepth: number | null;
  screenOrientationType: string | null;
  screenOrientationAngle: number | null;

  // Permissions
  permissionCamera: string | null;
  permissionMicrophone: string | null;
  permissionNotifications: string | null;
  permissionGeolocation: string | null;

  // Plugins / MIME
  plugins: string | null;
  mimeTypes: string | null;

  // Bot detection
  seleniumDetected: boolean;
  playwrightDetected: boolean;
  phantomDetected: boolean;
  nightmareDetected: boolean;
  puppeteerDetected: boolean;
  puppeteerDocumentNotAvailable: boolean;

  // Fingerprints
  canvasHash: string | null;
  audioHash: string | null;
  webGLRenderer: string | null;
  webGLVendor: string | null;
  webGLParamsHash: string | null;
  mathHash: string | null;
  intlHash: string | null;

  // Media preferences
  mediaPreferences: MediaPreferences | null;

  // Minimal surface
  windowFeatures: HashCount | null;
  cssKeys: HashCount | null;
  voices: HashCount | null;
  mediaMime: HashCount | null;
  fonts: HashCount | null;

  // Browser quirks
  rangeErrorLength: number | null;
  evalStringLength: number | null;

  // Timestamps
  createdAtMs: number;
  submittedAtMs?: number;
}

/** The result of a signal collection cycle. */
export interface RadarSignals {
  /** Unique signal collection ID (ULID). */
  id: string;
  /** The collected browser signals. */
  signals: Signals;
}
