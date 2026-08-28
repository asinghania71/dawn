import { test, expect } from '@playwright/test';

test.describe('Collection Enhancements', () => {
  test('Infinite Scroll loads more products automatically', async ({ page }) => {
    // Navigate to a collection page
    await page.goto('/collections/all');
    
    const infiniteScrollContainer = page.locator('infinite-scroll');
    if (await infiniteScrollContainer.count() > 0) {
      // Get initial product count
      const initialProducts = await page.locator('.product-grid .grid__item').count();
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for network request or DOM update
      await page.waitForTimeout(2000);
      
      // Verify more products loaded
      const newProducts = await page.locator('.product-grid .grid__item').count();
      
      // Only expect an increase if there are actually more products in the collection
      if (await page.locator('.loading-overlay').isVisible() === false) {
          // If loading spinner is gone, check if products increased or if it reached the end
          const hasReachedEnd = await infiniteScrollContainer.getAttribute('data-status') === 'complete';
          if (!hasReachedEnd) {
             expect(newProducts).toBeGreaterThan(initialProducts);
          }
      }
    }
  });
});
