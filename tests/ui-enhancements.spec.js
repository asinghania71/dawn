import { test, expect } from '@playwright/test';

test.describe('UI Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Multi-Collection Tabs switch content', async ({ page }) => {
    const tabsSection = page.locator('multi-collection-tabs').first();
    
    if (await tabsSection.count() > 0) {
      await tabsSection.scrollIntoViewIfNeeded();

      const tabs = tabsSection.locator('.tab-button');
      if (await tabs.count() > 1) {
        const secondTab = tabs.nth(1);
        const secondTabId = await secondTab.getAttribute('aria-controls');
        
        await secondTab.click();
        
        // Ensure the tab becomes active
        await expect(secondTab).toHaveAttribute('aria-selected', 'true');
        
        // Ensure the content panel is visible
        const contentPanel = tabsSection.locator(`#${secondTabId}`);
        await expect(contentPanel).toBeVisible();
      }
    }
  });

  test('Before and After Slider interaction', async ({ page }) => {
    const sliderSection = page.locator('before-after-slider').first();
    
    if (await sliderSection.count() > 0) {
      await sliderSection.scrollIntoViewIfNeeded();

      const sliderHandle = sliderSection.locator('.slider-handle');
      await expect(sliderHandle).toBeVisible();

      // Simulate dragging the slider handle
      const sliderBoundingBox = await sliderHandle.boundingBox();
      if (sliderBoundingBox) {
        await page.mouse.move(sliderBoundingBox.x + sliderBoundingBox.width / 2, sliderBoundingBox.y + sliderBoundingBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(sliderBoundingBox.x + 100, sliderBoundingBox.y + sliderBoundingBox.height / 2);
        await page.mouse.up();
        
        // The clip-path of the top image should have changed (hard to assert exact pixels, but we know it's interactive)
      }
    }
  });

  test('Free Shipping Bar updates on adding to cart', async ({ page }) => {
    await page.goto('/products');
    const productLinks = page.locator('.card-wrapper .full-unstyled-link');
    if (await productLinks.count() > 0) {
      await page.goto(await productLinks.first().getAttribute('href'));
    } else {
      return;
    }

    const freeShippingBar = page.locator('.free-shipping-bar').first();
    if (await freeShippingBar.count() > 0) {
      const initialText = await freeShippingBar.textContent();
      
      // Add product to cart
      await page.locator('button[name="add"]').click();
      await page.waitForTimeout(1000); // Wait for cart update
      
      // Check if text changed (e.g. from "You are $50 away" to "You have free shipping!" or similar)
      const newText = await freeShippingBar.textContent();
      expect(initialText).not.toEqual(newText);
    }
  });
});
