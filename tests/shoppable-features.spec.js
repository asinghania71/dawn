import { test, expect } from '@playwright/test';

test.describe('Shoppable Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Shop the Look hotspots open product info', async ({ page }) => {
    const shopTheLookSection = page.locator('shop-the-look').first();
    
    // Proceed only if the section exists on the homepage
    if (await shopTheLookSection.count() > 0) {
      await shopTheLookSection.scrollIntoViewIfNeeded();

      const hotspot = shopTheLookSection.locator('.hotspot-button').first();
      await expect(hotspot).toBeVisible();

      // Click the hotspot
      await hotspot.click();

      // Verify a product popup/drawer opens
      const productPopup = shopTheLookSection.locator('.shop-the-look__product-card').first();
      await expect(productPopup).toBeVisible();
      
      // Verify the add to cart button inside the popup
      await expect(productPopup.locator('button[name="add"]')).toBeVisible();
    }
  });

  test('Shoppable Shorts video interactions', async ({ page }) => {
    const shoppableShorts = page.locator('shoppable-shorts').first();
    
    if (await shoppableShorts.count() > 0) {
      await shoppableShorts.scrollIntoViewIfNeeded();

      const playButton = shoppableShorts.locator('.video-play-button').first();
      if (await playButton.isVisible()) {
        await playButton.click();
        
        // Check if the related products drawer/overlay becomes visible
        const productDrawer = shoppableShorts.locator('.shoppable-shorts__drawer');
        await expect(productDrawer).toBeVisible();
      }
    }
  });
});
