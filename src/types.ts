export interface RadarSignalsOptions {
  /** The publishable client ID from the WorkOS dashboard. */
  clientId: string;
}

export interface PuppeteerDetection {
  /** Whether Puppeteer was detected via querySelector stack-trace analysis. */
  detected: boolean;
  /** True when Document/Element globals are unavailable (e.g. SSR). */
  documentNotAvailable: boolean;
}

export interface RadarSignals {
  /** Unique signal collection ID (ULID). */
  id: string;
  /** ISO-8601 timestamp when signals were collected. */
  collectedAt: string;
}
