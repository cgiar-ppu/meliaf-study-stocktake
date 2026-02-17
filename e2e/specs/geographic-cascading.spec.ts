import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Geographic Scope Cascading (Section B)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/submit');
    await clearLocalStorage(page);

    // Open Section B
    await page.getByText('Study Classification').click();
  });

  test('Global scope hides all geographic fields', async ({ page }) => {
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'Global' }).click();

    // No region, country, or subnational fields should be visible
    await expect(page.getByLabel('Region(s)')).not.toBeVisible();
    await expect(page.getByLabel('Country(ies)')).not.toBeVisible();
    await expect(page.getByLabel('Province(s)/State(s)')).not.toBeVisible();
  });

  test('Site-specific scope hides all geographic fields', async ({ page }) => {
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'Site-specific' }).click();

    await expect(page.getByLabel('Region(s)')).not.toBeVisible();
    await expect(page.getByLabel('Country(ies)')).not.toBeVisible();
    await expect(page.getByLabel('Province(s)/State(s)')).not.toBeVisible();
  });

  test('Regional scope shows editable regions multi-select', async ({ page }) => {
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'Regional' }).click();

    // Region(s) field should appear
    const regionCombobox = page.getByRole('combobox', { name: /Region/i });
    await expect(regionCombobox).toBeVisible();

    // Select a region
    await regionCombobox.click();
    await page.getByRole('option', { name: /East and Southern Africa/i }).click();

    // Country and subnational should not be visible
    await expect(page.getByLabel('Country(ies)')).not.toBeVisible();
    await expect(page.getByLabel('Province(s)/State(s)')).not.toBeVisible();
  });

  test('National scope shows editable countries and auto-populated regions', async ({ page }) => {
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'National', exact: true }).click();

    // Country(ies) field should appear
    const countryCombobox = page.getByRole('combobox', { name: /Select countries/i });
    await expect(countryCombobox).toBeVisible();

    // Select Kenya
    await countryCombobox.click();
    await page.getByRole('option', { name: 'Kenya' }).click();

    // Region(s) should auto-populate as read-only badge
    await expect(page.getByText('Auto-populated from selected countries')).toBeVisible();
    await expect(page.getByText('East and Southern Africa')).toBeVisible();

    // Subnational should not be visible
    await expect(page.getByLabel('Province(s)/State(s)')).not.toBeVisible();
  });

  test('switching scope clears previous selections', async ({ page }) => {
    // Start with National, select a country
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'National', exact: true }).click();

    const countryCombobox = page.getByRole('combobox', { name: /Select countries/i });
    await countryCombobox.click();
    await page.getByRole('option', { name: 'Kenya' }).click();

    // Close the multi-select popover
    await page.keyboard.press('Escape');

    // Verify region auto-populated
    await expect(page.getByText('East and Southern Africa')).toBeVisible();

    // Switch to Global — should clear everything
    await page.getByRole('combobox', { name: /Geographic Scope/i }).click();
    await page.getByRole('option', { name: 'Global' }).click();

    // No geo fields should be visible
    await expect(page.getByText('East and Southern Africa')).not.toBeVisible();
    await expect(page.getByLabel('Country(ies)')).not.toBeVisible();
  });
});
