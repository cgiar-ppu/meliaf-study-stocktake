import { describe, it, expect } from 'vitest';
import { regionsForCountries, COUNTRY_TO_REGION, CGIAR_REGION_OPTIONS } from './cgiarGeography';

describe('regionsForCountries()', () => {
  it('returns [] for empty array', () => {
    expect(regionsForCountries([])).toEqual([]);
  });

  it('maps a single country to its region', () => {
    expect(regionsForCountries(['KE'])).toEqual(['ESA']);
  });

  it('deduplicates countries in the same region', () => {
    expect(regionsForCountries(['KE', 'UG'])).toEqual(['ESA']);
  });

  it('returns sorted regions for countries in different regions', () => {
    // KE → ESA, BR → LAC
    expect(regionsForCountries(['KE', 'BR'])).toEqual(['ESA', 'LAC']);
  });

  it('filters out unknown country codes', () => {
    expect(regionsForCountries(['XX'])).toEqual([]);
  });

  it('maps valid codes and ignores invalid ones', () => {
    expect(regionsForCountries(['KE', 'XX', 'BR'])).toEqual(['ESA', 'LAC']);
  });

  it('all 8 CGIAR regions are reachable', () => {
    const allRegions = new Set(Object.values(COUNTRY_TO_REGION));
    const expectedRegions = CGIAR_REGION_OPTIONS.map((r) => r.value).sort();
    expect([...allRegions].sort()).toEqual(expectedRegions);
  });

  it('result is always sorted alphabetically', () => {
    // IN → SA, US → NOA, FR → EUR, NG → WCA
    const result = regionsForCountries(['IN', 'US', 'FR', 'NG']);
    expect(result).toEqual([...result].sort());
  });
});
