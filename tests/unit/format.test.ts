import { describe, expect, it } from 'vitest';
import { availabilityLabel, formatDuration, formatTime, toDateInputValue } from '@/lib/format';
import { slugify, uniqueSlug } from '@/lib/slug';
import { isMotif, renderCover } from '@/lib/covers';
import { createBookingReference, createId } from '@/server/db/id';

describe('duration formatting', () => {
  it('renders minutes, hours and mixed values', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(195)).toBe('3h 15m');
    expect(formatDuration(480)).toBe('8h');
  });

  it('switches to days for whole-day durations', () => {
    expect(formatDuration(1440)).toBe('1 day');
    expect(formatDuration(2880)).toBe('2 days');
  });
});

describe('time zone handling', () => {
  it('renders a session in the event city’s zone, not the viewer’s', () => {
    // 18:00 UTC is 21:00 in Kuwait and 19:00 in London. Someone browsing from
    // London must still see the local departure time.
    const iso = '2026-10-01T18:00:00.000Z';
    expect(formatTime(iso, 'Asia/Kuwait')).toBe('21:00');
    expect(formatTime(iso, 'Europe/London')).toBe('19:00');
  });
});

describe('availability wording', () => {
  it('reports sold out at or below zero', () => {
    expect(availabilityLabel(0).tone).toBe('none');
    expect(availabilityLabel(-2).tone).toBe('none');
  });

  it('creates urgency only when stock is genuinely low', () => {
    expect(availabilityLabel(3)).toEqual({ text: 'Only 3 left', tone: 'low' });
    expect(availabilityLabel(15).tone).toBe('low');
    expect(availabilityLabel(60).tone).toBe('ok');
  });

  it('uses singular wording for a single seat', () => {
    expect(availabilityLabel(1).text).toBe('Only 1 left');
  });
});

describe('date input value', () => {
  it('uses the local calendar date rather than the UTC one', () => {
    const date = new Date(2026, 0, 5, 23, 30);
    expect(toDateInputValue(date)).toBe('2026-01-05');
  });
});

describe('slugs', () => {
  it('strips diacritics rather than mangling them', () => {
    expect(slugify('Montjuïc Sunrise Hike')).toBe('montjuic-sunrise-hike');
    expect(slugify('Café Málaga')).toBe('cafe-malaga');
  });

  it('expands ampersands and drops apostrophes', () => {
    expect(slugify("Arthur's Seat & Holyrood")).toBe('arthurs-seat-and-holyrood');
  });

  it('collapses punctuation and trims separators', () => {
    expect(slugify('  --Hello,   World!!  ')).toBe('hello-world');
  });

  it('disambiguates collisions with a numeric suffix', () => {
    const taken = new Set<string>();
    expect(uniqueSlug('dubai-cruise', taken)).toBe('dubai-cruise');
    expect(uniqueSlug('dubai-cruise', taken)).toBe('dubai-cruise-2');
    expect(uniqueSlug('dubai-cruise', taken)).toBe('dubai-cruise-3');
  });
});

describe('identifiers', () => {
  it('produces distinct ids', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => createId()));
    expect(ids.size).toBe(2000);
  });

  it('produces sortable-by-creation ids', () => {
    const first = createId();
    const second = createId();
    // The timestamp prefix keeps freshly created rows clustered in the index.
    expect(first.slice(0, 8) <= second.slice(0, 8)).toBe(true);
  });

  it('produces booking references without ambiguous characters', () => {
    for (let i = 0; i < 200; i += 1) {
      const reference = createBookingReference();
      expect(reference).toMatch(/^EVT-[A-HJ-NP-Z2-9]{6}$/);
    }
  });
});

describe('procedural covers', () => {
  it('is deterministic for a given seed', () => {
    expect(renderCover('marine', 'dhow-cruise')).toBe(renderCover('marine', 'dhow-cruise'));
  });

  it('produces different artwork for different seeds', () => {
    expect(renderCover('marine', 'dhow-cruise')).not.toBe(renderCover('marine', 'reef-dive'));
  });

  it('produces well-formed SVG', () => {
    const svg = renderCover('concerts', 'arena-night');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('recognises only known motifs', () => {
    expect(isMotif('marine')).toBe(true);
    expect(isMotif('../../etc/passwd')).toBe(false);
    expect(isMotif('<script>')).toBe(false);
  });
});
