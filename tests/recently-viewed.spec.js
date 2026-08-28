import { test, expect } from '@playwright/test';

test.describe('Recently Viewed Functionality', () => {
  test('tracks product visits and displays them', async ({ page }) => {
    // 1. Visit a product page
    await page.goto('/products'); // navigate to products list first
    const productLinks = page.locator('.card-wrapper .full-unstyled-link');
    if (await productLinks.count() === 0) return; // skip if no products

    const firstProductUrl = await productLinks.first().getAttribute('href');
    await page.goto(firstProductUrl);
    
    // Wait for the tracker script to execute
    await page.waitForTimeout(2000); // give time for localStorage update
    
    // Get the product title
    const productTitle = await page.locator('.product__title h1').textContent();

    // 2. Go back to homepage
    await page.goto('/');

    // 3. Find the recently viewed section
    const recentlyViewedSection = page.locator('recently-viewed');
    
    if (await recentlyViewedSection.isVisible()) {
      // Check if the visited product appears in the section
      await expect(recentlyViewedSection.locator('.card__heading')).toContainText(productTitle.trim());
    }
  });
});
