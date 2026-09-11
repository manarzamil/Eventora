/**
 * Money handling.
 *
 * Every amount in Eventora is an INTEGER in the currency's minor unit. This is
 * not pedantry: `0.1 + 0.2 !== 0.3` in IEEE-754, and a booking platform that
 * adds prices in floating point will eventually charge the wrong total.
 *
 * The minor-unit exponent is currency-specific and is NOT always 2 — Kuwaiti
 * dinars, Bahraini dinars and Omani rials use 3 decimal places (1 KWD =
 * 1000 fils), and a handful of currencies use 0. `Intl.NumberFormat` already
 * knows this, so it is the source of truth rather than a hand-maintained table.
 */

const exponentCache = new Map<string, number>();

/** Number of decimal places the currency uses (KWD → 3, USD → 2, JPY → 0). */
export function minorUnitExponent(currency: string): number {
  const key = currency.toUpperCase();
  const cached = exponentCache.get(key);
  if (cached !== undefined) return cached;

  let exponent = 2;
  try {
    exponent =
      new Intl.NumberFormat('en', { style: 'currency', currency: key }).resolvedOptions()
        .maximumFractionDigits ?? 2;
  } catch {
    exponent = 2;
  }
  exponentCache.set(key, exponent);
  return exponent;
}

/** 45.5 KWD → 45500 fils. Rounds half away from zero. */
export function toMinorUnits(amount: number, currency: string): number {
  const factor = 10 ** minorUnitExponent(currency);
  return Math.round(amount * factor);
}

/** 45500 fils → 45.5 */
export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** minorUnitExponent(currency);
}

/**
 * Formats a minor-unit amount for display, e.g. `formatMoney(18000, 'KWD')`
 * → "KD 18.000". Free events are rendered as "Free" rather than a zero amount.
 */
export function formatMoney(minor: number, currency: string, locale = 'en-GB'): string {
  if (minor === 0) return 'Free';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
  }).format(fromMinorUnits(minor, currency));
}

/** Compact variant used on dense cards: "KD 18" rather than "KD 18.000". */
export function formatMoneyCompact(minor: number, currency: string, locale = 'en-GB'): string {
  if (minor === 0) return 'Free';
  const value = fromMinorUnits(minor, currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
