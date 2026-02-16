import { describe, it, expect } from 'vitest';
import { countriesForSubnational } from './subnationalUnits';

describe('countriesForSubnational()', () => {
  it('returns [] for empty array', () => {
    expect(countriesForSubnational([])).toEqual([]);
  });

  it('extracts country from a single subnational code', () => {
    expect(countriesForSubnational(['KE-01'])).toEqual(['KE']);
  });

  it('deduplicates codes from the same country', () => {
    expect(countriesForSubnational(['KE-01', 'KE-02'])).toEqual(['KE']);
  });

  it('returns sorted countries for codes from different countries', () => {
    expect(countriesForSubnational(['UG-314', 'KE-01'])).toEqual(['KE', 'UG']);
  });

  it('ignores malformed code without dash', () => {
    expect(countriesForSubnational(['INVALID'])).toEqual([]);
  });

  it('ignores code with dash too early (< 2 chars before dash)', () => {
    expect(countriesForSubnational(['K-1'])).toEqual([]);
  });

  it('extracts valid codes and ignores malformed ones', () => {
    expect(countriesForSubnational(['KE-01', 'INVALID', 'BR-AC'])).toEqual(['BR', 'KE']);
  });

  it('result is always sorted alphabetically', () => {
    const result = countriesForSubnational(['ZW-HA', 'BR-AC', 'IN-KA', 'AU-NSW']);
    expect(result).toEqual([...result].sort());
  });
});
