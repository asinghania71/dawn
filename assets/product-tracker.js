if (!customElements.get('product-tracker')) {
  class ProductTracker extends HTMLElement {
    connectedCallback() {
      const productHandle = this.dataset.productHandle;
      if (!productHandle) return;

      let recentlyViewed = [];
      try {
        recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
        if (!Array.isArray(recentlyViewed)) recentlyViewed = [];
      } catch (e) {
        recentlyViewed = [];
      }

      // Remove if already exists to move it to the front
      recentlyViewed = recentlyViewed.filter(handle => handle !== productHandle);

      // Add to front
      recentlyViewed.unshift(productHandle);

      // Keep only the last 12
      if (recentlyViewed.length > 12) {
        recentlyViewed.pop();
      }

      try {
        localStorage.setItem('dawn_recently_viewed', JSON.stringify(recentlyViewed));
      } catch (e) {}
    }
  }
  customElements.define('product-tracker', ProductTracker);
}
