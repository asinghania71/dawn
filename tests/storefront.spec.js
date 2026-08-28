import { test, expect } from '@playwright/test';

test.describe('Shopify Theme Storefront', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the base URL (which points to the local theme dev server by default)
    const response = await page.goto('/');
    
    // Ensure the page loaded successfully
    expect(response?.status()).toBe(200);

    // Verify there is a header or main content area, typical for Dawn
    await expect(page.locator('header, .header')).toBeVisible();
  });

  test('can search for a product', async ({ page }) => {
    await page.goto('/');

    // Interact with the search icon/form (Dawn usually has a details-modal search or a search form)
    // This is a basic example and might need adjustment based on the exact Dawn version
    const searchIcon = page.locator('summary.header__icon--search').first();
    if (await searchIcon.isVisible()) {
      await searchIcon.click();
      
      const searchInput = page.locator('input[name="q"]').first();
      await searchInput.fill('shirt');
      await searchInput.press('Enter');
      
      // Wait for search results
      await expect(page).toHaveURL(/search/);
      await expect(page.locator('.facets-vertical, .search__results')).toBeVisible();
    }
  });
});
