import { test, expect } from '@playwright/test';
import { setupApiMocks, clearLocalStorage } from '../fixtures/test-helpers';

test.describe('Definitions page', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await clearLocalStorage(page);
  });

  test('navigate to Definitions via header link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Definitions' }).click();
    await expect(page).toHaveURL('/definitions');
    await expect(
      page.getByRole('heading', { name: /Study Classifications & Definitions/i })
    ).toBeVisible();
  });

  test('deep linking works (direct URL to /definitions)', async ({ page }) => {
    await page.goto('/definitions');
    await expect(
      page.getByRole('heading', { name: /Study Classifications & Definitions/i })
    ).toBeVisible();
  });

  test('renders all definition section headings', async ({ page }) => {
    await page.goto('/definitions');
    const sections = [
      'Study Types',
      'Causality Modes',
      'Timing',
      'Result Levels',
      'Method Classes',
      'Analytical Scope',
      'Geographic Scope',
    ];
    for (const title of sections) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('displays study type definitions with descriptions', async ({ page }) => {
    await page.goto('/definitions');
    // Spot-check a few study types
    await expect(page.getByText('Ex-ante Impact Assessment')).toBeVisible();
    await expect(page.getByText('Causal Impact Evaluation')).toBeVisible();
    await expect(page.getByText('MELIAF Method Study')).toBeVisible();
    // Check a description is present
    await expect(
      page.getByText(/counterfactual methods/i)
    ).toBeVisible();
  });

  test('displays Section C conditional logic explanation', async ({ page }) => {
    await page.goto('/definitions');
    await expect(
      page.getByRole('heading', { name: /Conditional Logic.*Section C/i })
    ).toBeVisible();
    await expect(page.getByText(/conditionally displayed/i)).toBeVisible();
  });

  test('Download PDF button is present and clickable', async ({ page }) => {
    await page.goto('/definitions');
    const btn = page.getByRole('button', { name: /Download PDF/i });
    await expect(btn).toBeVisible();
    // Click should not throw (PDF generation runs client-side)
    await btn.click();
  });
});
