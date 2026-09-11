/**
 * Date and duration formatting.
 *
 * Every session time is rendered in the **event's own city time zone**, not the
 * viewer's. Someone in London booking a Dubai cruise needs to see the local
 * departure time; showing it converted to their own zone is how people miss
 * boats. The IANA zone lives on the city row for exactly this reason.
 */

export function formatDate(iso: string, timezone?: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  }).format(new Date(iso));
}

export function formatLongDate(iso: string, timezone?: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(iso));
}

export function formatTime(iso: string, timezone?: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timezone?: string, locale = 'en-GB'): string {
  return `${formatDate(iso, timezone, locale)} · ${formatTime(iso, timezone, locale)}`;
}

/** 195 → "3h 15m"; 60 → "1h"; 45 → "45m" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (minutes % 1440 === 0 && minutes >= 1440) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "in 3 days", "tomorrow", "in 4 hours" — relative to now. */
export function formatRelative(iso: string, locale = 'en-GB'): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(diffMs / 86_400_000);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  return rtf.format(Math.round(days / 30), 'month');
}

/** Local-date `YYYY-MM-DD`, for `<input type="date">` values. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Availability wording used on cards and the booking panel. */
export function availabilityLabel(seatsLeft: number): {
  text: string;
  tone: 'ok' | 'low' | 'none';
} {
  if (seatsLeft <= 0) return { text: 'Sold out', tone: 'none' };
  if (seatsLeft <= 5) return { text: `Only ${seatsLeft} left`, tone: 'low' };
  if (seatsLeft <= 20) return { text: `${seatsLeft} places left`, tone: 'low' };
  return { text: 'Available', tone: 'ok' };
}
