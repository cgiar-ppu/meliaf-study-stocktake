import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/dashboard');
    await clearLocalStorage(page);
  });

  test('table renders with correct columns and rows', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize in East Africa')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Scaling Readiness Assessment for Climate-Smart Agriculture' })).toBeVisible();

    // Check column headers are visible
    await expect(page.getByRole('button', { name: /Study Title/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Lead Center/i }).first()).toBeVisible();
  });

  test('submission count badge shows correct number', async ({ page }) => {
    await expect(page.getByText('2 submissions')).toBeVisible();
  });

  test('text filter narrows results', async ({ page }) => {
    // Wait for data
    await expect(page.getByText('2 submissions')).toBeVisible();

    // Type in the Study Title filter
    await page.getByPlaceholder('Filter Study Title...').fill('Maize');

    // Should show only one result
    await expect(page.getByText('1 submission')).toBeVisible();
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();
    await expect(page.getByText('Scaling Readiness Assessment')).not.toBeVisible();
  });

  test('column visibility toggle hides/shows columns', async ({ page }) => {
    // Wait for data
    await expect(page.getByText('2 submissions')).toBeVisible();

    // Open column picker
    await page.getByRole('button', { name: /Columns/i }).click();

    // Uncheck "Contact Email" to hide that column
    const contactEmailCheckbox = page.getByRole('dialog').getByLabel('Contact Email');
    await contactEmailCheckbox.click();

    // Close popover by pressing Escape
    await page.keyboard.press('Escape');

    // Contact Email column header should no longer be visible
    await expect(page.getByRole('button', { name: 'Contact Email' })).not.toBeVisible();
  });

  test('export button shows format options', async ({ page }) => {
    // Wait for data
    await expect(page.getByText('2 submissions')).toBeVisible();

    // Click Export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Format options should be visible
    await expect(page.getByText('Excel (.xlsx)')).toBeVisible();
    await expect(page.getByText('CSV (.csv)')).toBeVisible();
    await expect(page.getByText('JSON (.json)')).toBeVisible();
  });
});
