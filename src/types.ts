export interface RadarSignalsOptions {
  /** The publishable client ID from the WorkOS dashboard. */
  clientId: string;
  /** Override the API base URL. Defaults to https://api.workos.com */
  apiUrl?: string;
}

export interface RadarSignals {
  /** Unique signal collection ID (ULID). */
  id: string;
  /** ISO-8601 timestamp when signals were collected. */
  collectedAt: string;
}
