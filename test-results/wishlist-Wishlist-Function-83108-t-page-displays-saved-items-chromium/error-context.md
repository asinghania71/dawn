# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wishlist.spec.js >> Wishlist Functionality >> wishlist page displays saved items
- Location: tests/wishlist.spec.js:43:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main-wishlist')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('main-wishlist')

```

```yaml
- alert:
  - img
  - heading "Upload Errors" [level=2]
  - text: sections/announcement-bar.liquid
  - list:
    - listitem: "Invalid schema: setting with id=\"display_style\" default must be one of the values"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Wishlist Functionality', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Go to a collection or homepage where products exist
  6  |     await page.goto('/');
  7  |   });
  8  | 
  9  |   test('can add a product to the wishlist', async ({ page }) => {
  10 |     // Wait for product cards to load
  11 |     const productCard = page.locator('.card-wrapper').first();
  12 |     await expect(productCard).toBeVisible();
  13 | 
  14 |     // Find the wishlist button on the first product card
  15 |     const wishlistButton = productCard.locator('button.wishlist-icon').first();
  16 |     
  17 |     // Check if it's already active, if so, click to remove it first
  18 |     if (await wishlistButton.evaluate((node) => node.classList.contains('active'))) {
  19 |       await wishlistButton.click();
  20 |       await page.waitForTimeout(500);
  21 |     }
  22 | 
  23 |     // Click to add to wishlist
  24 |     await wishlistButton.click();
  25 | 
  26 |     // Expect the button to become active
  27 |     await expect(wishlistButton).toHaveClass(/active/);
  28 | 
  29 |     // Open wishlist drawer (assuming there's a button in the header)
  30 |     const headerWishlistIcon = page.locator('header .wishlist-icon-link').first();
  31 |     if (await headerWishlistIcon.isVisible()) {
  32 |       await headerWishlistIcon.click();
  33 |       
  34 |       const wishlistDrawer = page.locator('wishlist-drawer, #wishlist-drawer');
  35 |       await expect(wishlistDrawer).toBeVisible();
  36 |       
  37 |       // Ensure the product is in the drawer
  38 |       const productTitle = await productCard.locator('.card__heading').textContent();
  39 |       await expect(wishlistDrawer.locator('.wishlist-item')).toContainText(productTitle.trim());
  40 |     }
  41 |   });
  42 | 
  43 |   test('wishlist page displays saved items', async ({ page }) => {
  44 |     // Go directly to wishlist page
  45 |     await page.goto('/pages/wishlist');
  46 |     
  47 |     const mainWishlist = page.locator('main-wishlist');
> 48 |     await expect(mainWishlist).toBeVisible();
     |                                ^ Error: expect(locator).toBeVisible() failed
  49 |     
  50 |     // Check if there's a list of products or an empty state
  51 |     const emptyMessage = mainWishlist.locator('.wishlist-empty-message');
  52 |     const hasItems = await mainWishlist.locator('.wishlist-item').count() > 0;
  53 |     
  54 |     expect(await emptyMessage.isVisible() || hasItems).toBeTruthy();
  55 |   });
  56 | });
  57 | 
```