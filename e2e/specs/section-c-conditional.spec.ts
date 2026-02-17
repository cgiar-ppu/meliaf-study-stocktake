import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Section C Conditional Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/submit');
    await clearLocalStorage(page);
  });

  test('Section C hidden by default', async ({ page }) => {
    // Section C ("Research Details") should not be rendered when no
    // triggering conditions are set
    await expect(page.getByRole('heading', { name: 'Research Details' })).toHaveCount(0);
  });

  test('Section C appears when causalityMode = C2 (Causal)', async ({ page }) => {
    // Open Section B
    await page.getByText('Study Classification').click();

    // Set causality mode to C2
    await page.getByRole('combobox', { name: /Causality Mode/i }).click();
    await page.getByRole('option', { name: 'C2' }).click();

    // Section C should now be visible
    await expect(page.getByRole('heading', { name: 'Research Details' })).toBeVisible();
  });

  test('Section C appears when methodClass = Quantitative', async ({ page }) => {
    // Open Section B
    await page.getByText('Study Classification').click();

    // Set method class to Quantitative
    await page.getByRole('combobox', { name: /Method Class/i }).click();
    await page.getByRole('option', { name: 'Quantitative' }).click();

    // Section C should now be visible
    await expect(page.getByRole('heading', { name: 'Research Details' })).toBeVisible();
  });

  test('Section C appears when methodClass = Experimental / Quasi-Experimental', async ({ page }) => {
    // Open Section B
    await page.getByText('Study Classification').click();

    // Set method class to Experimental
    await page.getByRole('combobox', { name: /Method Class/i }).click();
    await page.getByRole('option', { name: /Experimental/i }).click();

    // Section C should now be visible
    await expect(page.getByRole('heading', { name: 'Research Details' })).toBeVisible();
  });
});
