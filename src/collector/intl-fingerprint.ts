/**
 * Intl API fingerprinting.
 * Formatting behaviour varies across browser engines and OS locales.
 */

import { sha256Base64Url } from "./crypto";

export async function collectIntlFingerprint(): Promise<string | null> {
  try {
    const parts: string[] = [];

    // DateTimeFormat with specific options
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    parts.push(dtf.format(new Date(2000, 0, 1)));

    // NumberFormat
    const nf = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });
    parts.push(nf.format(123456.789));

    // PluralRules
    try {
      const pr = new Intl.PluralRules("en-US");
      parts.push(pr.select(0));
      parts.push(pr.select(1));
      parts.push(pr.select(2));
    } catch {
      parts.push("no-plural-rules");
    }

    // RelativeTimeFormat
    try {
      const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
      parts.push(rtf.format(-1, "day"));
      parts.push(rtf.format(1, "day"));
    } catch {
      parts.push("no-relative-time");
    }

    // ListFormat
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IntlAny = Intl as any;
      if (IntlAny.ListFormat) {
        const lf = new IntlAny.ListFormat("en-US", {
          style: "long",
          type: "conjunction",
        });
        parts.push(lf.format(["a", "b", "c"]));
      } else {
        parts.push("no-list-format");
      }
    } catch {
      parts.push("no-list-format");
    }

    return sha256Base64Url(parts.join("|"));
  } catch {
    return null;
  }
}
