/**
 * Iraqi mobile numbers: 7XXXXXXXXX (10 digits after the leading 7),
 * optionally prefixed with a domestic "0" or the "+964" country code.
 * Normalizes any accepted input to E.164 (+964XXXXXXXXXX) so storage,
 * WhatsApp delivery, and duplicate-lookup all compare the same string.
 */
const IRAQI_MOBILE_PATTERN = /^7\d{9}$/;

export function normalizeIraqiPhone(raw: string): string | null {
  const digitsOnly = raw.replace(/[\s()-]/g, '');
  const withoutCountryCode = digitsOnly.startsWith('+964')
    ? digitsOnly.slice(4)
    : digitsOnly.startsWith('00964')
      ? digitsOnly.slice(5)
      : digitsOnly.startsWith('964')
        ? digitsOnly.slice(3)
        : digitsOnly.startsWith('0')
          ? digitsOnly.slice(1)
          : digitsOnly;

  if (!IRAQI_MOBILE_PATTERN.test(withoutCountryCode)) {
    return null;
  }
  return `+964${withoutCountryCode}`;
}

export function isValidIraqiPhone(raw: string): boolean {
  return normalizeIraqiPhone(raw) !== null;
}
