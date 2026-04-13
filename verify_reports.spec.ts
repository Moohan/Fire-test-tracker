import { test, expect } from '@playwright/test';

test('verify reports page and login', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Dashboard should redirect and load
  await expect(page).toHaveURL(/.*dashboard/);
  await page.screenshot({ path: 'dashboard.png' });

  // Navigate to reports
  await page.goto('http://localhost:3000/reports');
  await expect(page.locator('h1')).toContainText('Reports & Export');
  await page.screenshot({ path: 'reports_page.png' });

  // Check equipment list in reports
  await page.waitForSelector('input[placeholder="Search equipment..."]');
  const equipmentItems = page.locator('label:has-text("E001")');
  await expect(equipmentItems).toBeVisible();

  // Navigate to log page
  await page.goto('http://localhost:3000/log/E001'); // Note: id might be different if cuid is used, but seed uses externalId "E001" for a record. Wait, the route uses DB ID.
});
