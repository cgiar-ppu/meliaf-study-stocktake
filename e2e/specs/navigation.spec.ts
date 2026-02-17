import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await clearLocalStorage(page);
  });

  test('home page loads with Introduction content', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /MELIAF Studies Explorer/i })).toBeVisible();
    await expect(page.getByText('Value proposition')).toBeVisible();
  });

  test('navigate between pages via header nav links', async ({ page }) => {
    // Navigate to My Submissions
    await page.getByRole('link', { name: 'My Submissions' }).click();
    await expect(page).toHaveURL('/submissions');
    await expect(page.getByRole('heading', { name: 'My Submissions' })).toBeVisible();

    // Navigate to Submit Study
    await page.getByRole('link', { name: 'Submit Study' }).click();
    await expect(page).toHaveURL('/submit');
    await expect(page.getByText('Basic Information')).toBeVisible();

    // Navigate to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Navigate back to Introduction
    await page.getByRole('link', { name: 'Introduction' }).click();
    await expect(page).toHaveURL('/');
  });

  test('user info shown in header (demo mode user)', async ({ page }) => {
    // Demo mode shows "Demo User" in the user dropdown button
    await expect(page.getByText('Demo User')).toBeVisible();
  });

  test('404 for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('deep linking works (direct URL to /dashboard)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('deep linking works (direct URL to /submissions)', async ({ page }) => {
    await page.goto('/submissions');
    await expect(page.getByRole('heading', { name: 'My Submissions' })).toBeVisible();
  });
});
