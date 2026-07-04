if (!customElements.get('product-tracker')) {
  class ProductTracker extends HTMLElement {
    connectedCallback() {
      const productId = this.dataset.productId;
      if (!productId) return;
  
      let recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
      
      // Remove if already exists to move it to the front
      recentlyViewed = recentlyViewed.filter(id => id !== productId);
      
      // Add to front
      recentlyViewed.unshift(productId);
      
      // Keep only the last 10
      if (recentlyViewed.length > 10) {
        recentlyViewed.pop();
      }
      
      localStorage.setItem('dawn_recently_viewed', JSON.stringify(recentlyViewed));
    }
  }
  customElements.define('product-tracker', ProductTracker);
}

if (!customElements.get('recently-viewed-products')) {
  class RecentlyViewedProducts extends HTMLElement {
    async connectedCallback() {
      const sectionId = this.dataset.sectionId;
      if (!sectionId) return;
  
      let recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
      
      // Don't show current product in recently viewed
      const currentProductId = document.querySelector('product-tracker')?.dataset.productId;
      if (currentProductId) {
        recentlyViewed = recentlyViewed.filter(id => id !== currentProductId);
      }
      
      const limit = parseInt(this.dataset.limit) || 4;
      recentlyViewed = recentlyViewed.slice(0, limit);
  
      if (recentlyViewed.length === 0) {
        this.style.display = 'none';
        return;
      }
  
      const query = recentlyViewed.map(id => `id:${id}`).join(' OR ');
      const searchUrl = `${window.routes ? window.routes.search_url : '/search'}?q=${query}&type=product&section_id=${sectionId}`;
  
      try {
        const response = await fetch(searchUrl);
        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;
  
        const newContent = html.querySelector('recently-viewed-products');
        if (newContent && newContent.innerHTML.trim().length > 0) {
          this.innerHTML = newContent.innerHTML;
          this.removeAttribute('hidden');
        } else {
          this.style.display = 'none';
        }
      } catch (e) {
        console.error('Error fetching recently viewed products:', e);
        this.style.display = 'none';
      }
    }
  }
  customElements.define('recently-viewed-products', RecentlyViewedProducts);
}
