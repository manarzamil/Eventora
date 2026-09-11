import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  formatMoneyCompact,
  fromMinorUnits,
  minorUnitExponent,
  toMinorUnits,
} from '@/lib/money';

describe('minor-unit handling', () => {
  it('knows that not every currency has two decimal places', () => {
    // The whole reason the exponent is looked up rather than hardcoded: a
    // Kuwaiti dinar is 1000 fils, not 100.
    expect(minorUnitExponent('KWD')).toBe(3);
    expect(minorUnitExponent('BHD')).toBe(3);
    expect(minorUnitExponent('GBP')).toBe(2);
    expect(minorUnitExponent('EUR')).toBe(2);
    expect(minorUnitExponent('JPY')).toBe(0);
  });

  it('falls back to two decimals for an unknown code rather than throwing', () => {
    expect(minorUnitExponent('XXX')).toBe(2);
  });

  it('converts major units to minor units per currency', () => {
    expect(toMinorUnits(18, 'KWD')).toBe(18_000);
    expect(toMinorUnits(18, 'GBP')).toBe(1_800);
    expect(toMinorUnits(18, 'JPY')).toBe(18);
  });

  it('round-trips without drift', () => {
    for (const [amount, currency] of [
      [45.5, 'KWD'],
      [0.1, 'GBP'],
      [0.2, 'EUR'],
      [1234.56, 'AED'],
    ] as const) {
      expect(fromMinorUnits(toMinorUnits(amount, currency), currency)).toBeCloseTo(amount, 5);
    }
  });

  it('adds prices exactly, which floating point would not', () => {
    // 0.1 + 0.2 !== 0.3 in IEEE-754. In minor units it is simply 10 + 20.
    const a = toMinorUnits(0.1, 'GBP');
    const b = toMinorUnits(0.2, 'GBP');
    expect(a + b).toBe(toMinorUnits(0.3, 'GBP'));
  });

  it('multiplies a unit price by a quantity exactly', () => {
    const unit = toMinorUnits(12.345, 'KWD');
    expect(unit * 7).toBe(86_415);
    expect(fromMinorUnits(unit * 7, 'KWD')).toBeCloseTo(86.415, 5);
  });
});

describe('formatting', () => {
  it('renders a KWD amount with three decimals', () => {
    expect(formatMoney(18_000, 'KWD')).toContain('18.000');
  });

  it('renders a GBP amount with two decimals', () => {
    expect(formatMoney(1_850, 'GBP')).toContain('18.50');
  });

  it('says "Free" rather than showing a zero amount', () => {
    expect(formatMoney(0, 'KWD')).toBe('Free');
    expect(formatMoneyCompact(0, 'GBP')).toBe('Free');
  });

  it('drops trailing zeros in the compact form used on dense cards', () => {
    expect(formatMoneyCompact(18_000, 'KWD')).not.toContain('.000');
  });
});
