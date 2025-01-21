import { test, expect } from '@playwright/test';

test.describe('Domain Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays dashboard components', async ({ page }) => {
    // Check main sections
    await expect(page.getByText('Domain Portfolio Analysis')).toBeVisible();
    await expect(page.getByText('Domain Values')).toBeVisible();
    await expect(page.getByText('Portfolio Distribution')).toBeVisible();
    await expect(page.getByText('Domain Metrics')).toBeVisible();
    await expect(page.getByText('Affiliate Opportunities')).toBeVisible();
  });

  test('loads domain data', async ({ page }) => {
    // Wait for data to load
    await page.waitForResponse(
      (response) => response.url().includes('/api/domains') && response.status() === 200
    );

    // Check if metrics table is populated
    const tableRows = await page.$$('table tbody tr');
    expect(tableRows.length).toBeGreaterThan(0);
  });

  test('charts are rendered', async ({ page }) => {
    // Check for chart canvases
    const charts = await page.$$('canvas');
    expect(charts.length).toBe(2); // Bar and Pie charts
  });

  test('responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.chartGrid')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.chartGrid')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.chartGrid')).toBeVisible();
  });

  test('error handling', async ({ page }) => {
    // Mock API error
    await page.route('/api/domains', (route) => route.fulfill({ status: 500 }));

    // Reload page
    await page.reload();

    // Check for error message
    await expect(page.getByText(/error/i)).toBeVisible();
  });
});
