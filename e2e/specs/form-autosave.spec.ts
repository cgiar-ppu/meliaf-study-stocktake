import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Form Auto-Save & Draft Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('draft saved to localStorage after typing', async ({ page }) => {
    await page.goto('/submit');
    await clearLocalStorage(page);

    // Type in Study ID
    await page.getByPlaceholder('Enter the ID of the study').fill('DRAFT-001');

    // Wait for auto-save debounce (2 seconds + buffer)
    await page.waitForTimeout(3000);

    // Check localStorage
    const draft = await page.evaluate(() => localStorage.getItem('meliaf_study_draft'));
    expect(draft).toBeTruthy();
    expect(draft).toContain('DRAFT-001');
  });

  test('draft recovery dialog appears on revisit', async ({ page }) => {
    await page.goto('/submit');
    await clearLocalStorage(page);

    // Type some data
    await page.getByPlaceholder('Enter the ID of the study').fill('DRAFT-002');
    await page.getByPlaceholder('Enter the full title of the study').fill('My Draft Study');

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Navigate away and back
    await page.goto('/');
    await page.goto('/submit');

    // Draft recovery dialog should appear
    await expect(page.getByText(/Continue with saved draft/i)).toBeVisible();
  });

  test('"Continue Draft" restores form values', async ({ page }) => {
    await page.goto('/submit');
    await clearLocalStorage(page);

    // Type data
    await page.getByPlaceholder('Enter the ID of the study').fill('DRAFT-003');
    await page.getByPlaceholder('Enter the full title of the study').fill('Restored Study');

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Navigate away and back
    await page.goto('/');
    await page.goto('/submit');

    // Click Continue Draft
    await page.getByRole('button', { name: /Continue Draft/i }).click();

    // Form should have restored values
    await expect(page.getByPlaceholder('Enter the ID of the study')).toHaveValue('DRAFT-003');
    await expect(page.getByPlaceholder('Enter the full title of the study')).toHaveValue('Restored Study');
  });

  test('"Start Fresh" clears draft', async ({ page }) => {
    await page.goto('/submit');
    await clearLocalStorage(page);

    // Type data
    await page.getByPlaceholder('Enter the ID of the study').fill('DRAFT-004');

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Navigate away and back
    await page.goto('/');
    await page.goto('/submit');

    // Click Start Fresh
    await page.getByRole('button', { name: /Start Fresh/i }).click();

    // Form should be empty
    await expect(page.getByPlaceholder('Enter the ID of the study')).toHaveValue('');

    // localStorage should be cleared
    const draft = await page.evaluate(() => localStorage.getItem('meliaf_study_draft'));
    expect(draft).toBeNull();
  });
});
