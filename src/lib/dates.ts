import type { Locale } from '../i18n/ui';

export interface MonthParts {
  year: number;
  month: number;
}

export function monthParts(value: string): MonthParts {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

export function formatMonth(value: string, locale: Locale): string {
  const { year, month } = monthParts(value);
  if (locale === 'zh') return `${year}年${month}月`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatPeriod(
  start: string,
  end: string | null,
  locale: Locale,
  presentLabel: string,
): string {
  return `${formatMonth(start, locale)} — ${end ? formatMonth(end, locale) : presentLabel}`;
}
