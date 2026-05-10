import type { Currency } from "../types";

/** Reads the browser locale and extracts the ISO 3166-1 alpha-2 territory code.
 *  Returns null if the locale carries no territory (e.g. bare "en"). */
export function detectRegionCode(): string | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.replace("_", "-");
    const parts = locale.split("-");
    if (parts.length >= 2) {
      const territory = parts[parts.length - 1].toUpperCase();
      if (/^[A-Z]{2}$/.test(territory)) return territory;
    }
  } catch {
    // Intl not available in some environments
  }
  return null;
}

/** Converts a USD amount to the user's currency and formats it.
 *  Falls back to USD display when the currency list hasn't loaded yet. */
export function formatPrice(
  amountUsd: number,
  currencyCode: string,
  currencies: Currency[],
): string {
  if (amountUsd === 0) return "Free";
  const currency = currencies.find((c) => c.code === currencyCode);
  const code = currency ? currencyCode : "USD";
  const converted = amountUsd * (currency?.rateVsUsd ?? 1);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    maximumFractionDigits: ["JPY", "KRW"].includes(code) ? 0 : 2,
  }).format(converted);
}
