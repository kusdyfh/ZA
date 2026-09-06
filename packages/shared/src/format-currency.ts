export interface FormatCurrencyOptions {
  /** ISO 4217 currency code. Defaults to IQD, matching the platform's
   *  default per docs/v2/adr/0004-order-snapshot-redesign.md. */
  currency?: string;
  locale?: string;
}

/**
 * Formats a numeric amount as a localized currency string. Never does
 * arithmetic on money itself — that stays server-side, per
 * docs/03-DATABASE-SCHEMA.md's Decimal/Money convention. This is a
 * display-only formatter.
 */
export function formatCurrency(
  amount: number,
  { currency = 'IQD', locale = 'en-US' }: FormatCurrencyOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: currency === 'IQD' ? 0 : 2,
    maximumFractionDigits: currency === 'IQD' ? 0 : 2,
  }).format(amount);
}
