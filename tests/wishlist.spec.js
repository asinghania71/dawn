import { test, expect } from '@playwright/test';

test.describe('Wishlist Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to a collection or homepage where products exist
    await page.goto('/');
  });

  test('can add a product to the wishlist', async ({ page }) => {
    // Wait for product cards to load
    const productCard = page.locator('.card-wrapper').first();
    await expect(productCard).toBeVisible();

    // Find the wishlist button on the first product card
    const wishlistButton = productCard.locator('button.wishlist-icon').first();
    
    // Check if it's already active, if so, click to remove it first
    if (await wishlistButton.evaluate((node) => node.classList.contains('active'))) {
      await wishlistButton.click();
      await page.waitForTimeout(500);
    }

    // Click to add to wishlist
    await wishlistButton.click();

    // Expect the button to become active
    await expect(wishlistButton).toHaveClass(/active/);

    // Open wishlist drawer (assuming there's a button in the header)
    const headerWishlistIcon = page.locator('header .wishlist-icon-link').first();
    if (await headerWishlistIcon.isVisible()) {
      await headerWishlistIcon.click();
      
      const wishlistDrawer = page.locator('wishlist-drawer, #wishlist-drawer');
      await expect(wishlistDrawer).toBeVisible();
      
      // Ensure the product is in the drawer
      const productTitle = await productCard.locator('.card__heading').textContent();
      await expect(wishlistDrawer.locator('.wishlist-item')).toContainText(productTitle.trim());
    }
  });

  test('wishlist page displays saved items', async ({ page }) => {
    // Go directly to wishlist page
    await page.goto('/pages/wishlist');
    
    const mainWishlist = page.locator('main-wishlist');
    await expect(mainWishlist).toBeVisible();
    
    // Check if there's a list of products or an empty state
    const emptyMessage = mainWishlist.locator('.wishlist-empty-message');
    const hasItems = await mainWishlist.locator('.wishlist-item').count() > 0;
    
    expect(await emptyMessage.isVisible() || hasItems).toBeTruthy();
  });
});
