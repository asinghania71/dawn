import { test, expect } from '@playwright/test';

test.describe('Estimated Delivery Block', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a known product page
    await page.goto('/products/the-complete-snowboard');
  });

  test('block renders on the product page', async ({ page }) => {
    // Check for the wrapper and the list
    const deliveryList = page.locator('.estimated-delivery__list');
    await expect(deliveryList).toBeVisible();
    
    // Ensure it renders at least one list item (e.g. "Others" fallback)
    const listItems = deliveryList.locator('li');
    await expect(listItems.count()).resolves.toBeGreaterThanOrEqual(1);
  });

  test('displays valid date strings', async ({ page }) => {
    const listItems = page.locator('.estimated-delivery__list li');
    const firstItemText = await listItems.first().textContent();
    
    // The default format is %b %e (e.g. "Aug 4" or "Sep  1")
    // Let's just check that it contains a colon (city: dates) and a dash (date - date)
    expect(firstItemText).toContain(':');
    expect(firstItemText).toContain('-');
    
    // Verify fallback city "Others" or a custom city exists
    expect(firstItemText.trim().length).toBeGreaterThan(5);
  });

  test('SVG icon is rendered correctly', async ({ page }) => {
    // We expect the truck icon or a custom image to be beside the text
    const iconContainer = page.locator('.estimated-delivery__icon, .icon-accordion').first();
    await expect(iconContainer).toBeVisible();
  });
});
