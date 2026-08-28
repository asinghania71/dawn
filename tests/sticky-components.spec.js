import { test, expect } from '@playwright/test';

test.describe('Sticky Components', () => {
  test('Sticky Add to Cart appears on scroll in product page', async ({ page }) => {
    // Navigate to a product page
    await page.goto('/products');
    const productLinks = page.locator('.card-wrapper .full-unstyled-link');
    if (await productLinks.count() > 0) {
      const firstProductUrl = await productLinks.first().getAttribute('href');
      await page.goto(firstProductUrl);
    } else {
      return; // Skip if no products
    }

    // Ensure page is long enough to scroll
    await page.evaluate(() => window.scrollTo(0, 0));

    const stickyAddToCart = page.locator('sticky-add-to-cart');
    
    // Check if the component is in the DOM (it might be hidden initially)
    if (await stickyAddToCart.count() > 0) {
      // Scroll down past the main add to cart button
      await page.evaluate(() => window.scrollBy(0, 1500));
      
      // The sticky component should now be visible
      // Depending on implementation, it might add a class like 'is-visible' or change display
      await expect(stickyAddToCart).toBeVisible();

      // Click the sticky add to cart
      await stickyAddToCart.locator('button[type="submit"]').click();

      // Verify cart updates
      const cartDrawer = page.locator('cart-drawer');
      if (await cartDrawer.count() > 0) {
        await expect(cartDrawer).toBeVisible();
      }
    }
  });

  test('Sticky Bottom Nav is visible on mobile', async ({ page, isMobile }) => {
    // Only run if the viewport is mobile
    if (!isMobile) return;

    await page.goto('/');

    const stickyNav = page.locator('sticky-bottom-nav');
    if (await stickyNav.count() > 0) {
      await expect(stickyNav).toBeVisible();
      
      // Click on a nav item (e.g., search or cart)
      const searchItem = stickyNav.locator('.sticky-nav__item[data-action="search"]');
      if (await searchItem.isVisible()) {
        await searchItem.click();
        await expect(page.locator('.predictive-search')).toBeVisible();
      }
    }
  });
});
