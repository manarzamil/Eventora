import { describe, expect, it } from 'vitest';
import { zoneOffsetMs, zonedTimeToUtc } from '@/lib/timezone';
import { formatTime } from '@/lib/format';

describe('zone offsets', () => {
  it('measures a fixed-offset zone', () => {
    // Kuwait is UTC+3 all year — no daylight saving.
    expect(zoneOffsetMs(Date.UTC(2026, 0, 15, 12), 'Asia/Kuwait')).toBe(3 * 3_600_000);
    expect(zoneOffsetMs(Date.UTC(2026, 6, 15, 12), 'Asia/Kuwait')).toBe(3 * 3_600_000);
  });

  it('measures a zone that observes daylight saving', () => {
    expect(zoneOffsetMs(Date.UTC(2026, 0, 15, 12), 'Europe/London')).toBe(0);
    expect(zoneOffsetMs(Date.UTC(2026, 6, 15, 12), 'Europe/London')).toBe(3_600_000);
  });
});

describe('wall time to instant', () => {
  it('builds an instant that displays as the intended local time', () => {
    // A 17:30 sunset cruise in Dubai must read as 17:30 in Dubai — the bug this
    // guards is storing 17:30 UTC and showing users 21:30.
    const instant = zonedTimeToUtc(2026, 10, 1, 17, 30, 'Asia/Dubai');
    expect(formatTime(instant.toISOString(), 'Asia/Dubai')).toBe('17:30');
  });

  it('holds across a daylight-saving boundary', () => {
    const summer = zonedTimeToUtc(2026, 7, 15, 9, 0, 'Europe/London');
    const winter = zonedTimeToUtc(2026, 1, 15, 9, 0, 'Europe/London');
    expect(formatTime(summer.toISOString(), 'Europe/London')).toBe('09:00');
    expect(formatTime(winter.toISOString(), 'Europe/London')).toBe('09:00');
    // The stored UTC instants differ by the DST offset, which is the point.
    expect(summer.getUTCHours()).toBe(8);
    expect(winter.getUTCHours()).toBe(9);
  });

  it('handles midnight without rolling into the previous day', () => {
    const instant = zonedTimeToUtc(2026, 10, 1, 0, 0, 'Asia/Riyadh');
    expect(formatTime(instant.toISOString(), 'Asia/Riyadh')).toBe('00:00');
  });
});
