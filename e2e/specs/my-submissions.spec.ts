import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('My Submissions', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/submissions');
    await clearLocalStorage(page);
  });

  test('active submissions listed with correct details', async ({ page }) => {
    // Wait for submissions to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize in East Africa')).toBeVisible();
    // Use full title to avoid strict mode violation
    await expect(page.getByText('Scaling Readiness Assessment for Climate-Smart Agriculture')).toBeVisible();

    // Check lead center is shown
    await expect(page.getByText('CIMMYT').first()).toBeVisible();
  });

  test('stats cards show correct counts', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();

    // Check stat card values via their card structure
    // Total Submissions = 2 active + 1 archived = 3
    await expect(page.locator('.text-3xl').filter({ hasText: '3' })).toBeVisible();
    // Active Studies = 2
    await expect(page.locator('.text-3xl').filter({ hasText: '2' }).first()).toBeVisible();
  });

  test('preview sheet opens with study details', async ({ page }) => {
    // Wait for submissions to load first
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();

    // Click preview (eye icon) on first submission
    await page.getByTitle('Preview').first().click();

    // Sheet should open with submission ID in the details
    await expect(page.locator('[role="dialog"]').getByText('MELIAF-2025-001', { exact: true })).toBeVisible();
  });

  test('archive flow: dialog with confirmation text → DELETE call', async ({ page }) => {
    // Wait for submissions to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();

    // Track DELETE request
    const deletePromise = page.waitForRequest(
      (req) => req.url().includes('/submissions/') && req.method() === 'DELETE'
    );

    // Open preview sheet
    await page.getByTitle('Preview').first().click();

    // Wait for sheet to load
    await expect(page.locator('[role="dialog"]').getByText('MELIAF-2025-001', { exact: true })).toBeVisible();

    // Click Archive button in the sheet footer
    await page.locator('[role="dialog"]').getByRole('button', { name: /Archive/i }).click();

    // Confirmation dialog requires typing "archive"
    await expect(page.getByText('Archive this submission?')).toBeVisible();
    await page.getByPlaceholder('Type "archive" to confirm').fill('archive');

    // Click the Archive button in the confirmation dialog
    await page.getByRole('button', { name: 'Archive', exact: true }).last().click();

    // Wait for DELETE request
    await deletePromise;
  });

  test('edit button navigates to /submit/:id', async ({ page }) => {
    // Wait for submissions to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();

    // Open preview sheet
    await page.getByTitle('Preview').first().click();

    // Wait for sheet to load
    await expect(page.locator('[role="dialog"]').getByText('MELIAF-2025-001', { exact: true })).toBeVisible();

    // Click Edit button
    await page.locator('[role="dialog"]').getByRole('button', { name: /Edit/i }).click();

    // Should navigate to edit URL
    await expect(page).toHaveURL(/\/submit\/sub-001/);
  });

  test('archived submissions section shown when archived items exist', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('Impact of Drought-Tolerant Maize')).toBeVisible();

    // Use heading role to avoid matching the description text
    await expect(page.getByRole('heading', { name: 'Archived Submissions' })).toBeVisible();
    await expect(page.getByText('Archived Foresight Study')).toBeVisible();
  });
});
