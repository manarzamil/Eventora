/**
 * Converting a local wall-clock time in a named zone to a UTC instant.
 *
 * The seeder needs this: a sunset cruise in Dubai starts at 17:30 *Dubai time*,
 * and storing 17:30 UTC would display as 21:30 to everyone. `Date` offers no
 * way to construct an instant from a wall time in an arbitrary zone, so the
 * offset is measured with `Intl` and subtracted.
 */

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
export function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(new Date(instantMs))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }

  const asUtc = Date.UTC(
    parts.year!,
    parts.month! - 1,
    parts.day!,
    // Intl renders midnight as 24 in some engines with hour12:false.
    parts.hour! % 24,
    parts.minute!,
    parts.second!,
  );

  return asUtc - instantMs;
}

/**
 * Builds the UTC instant at which the given wall-clock time occurs in
 * `timeZone`. Two passes settle the offset correctly across a DST boundary,
 * where the naive guess would land on the wrong side of the transition.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = target - zoneOffsetMs(target, timeZone);
  instant = target - zoneOffsetMs(instant, timeZone);
  return new Date(instant);
}
