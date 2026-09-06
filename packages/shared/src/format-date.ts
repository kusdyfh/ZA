export interface FormatDateOptions {
  locale?: string;
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
}

/**
 * Formats a Date (or ISO date string) for display. Used anywhere the
 * UI shows a timestamp — order dates, published-at dates, and so on.
 */
export function formatDate(
  value: Date | string,
  { locale = 'en-US', dateStyle = 'medium', timeStyle }: FormatDateOptions = {},
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
}
