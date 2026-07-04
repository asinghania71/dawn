if (!customElements.get('product-tracker')) {
  class ProductTracker extends HTMLElement {
    connectedCallback() {
      const productHandle = this.dataset.productHandle;
      if (!productHandle) return;
  
      let recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
      
      // Remove if already exists to move it to the front
      recentlyViewed = recentlyViewed.filter(handle => handle !== productHandle);
      
      // Add to front
      recentlyViewed.unshift(productHandle);
      
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
    constructor() {
      super();
      this.limit = parseInt(this.dataset.limit) || 4;
      this.init();
    }

    async init() {
      try {
        const recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
        
        if (recentlyViewed.length === 0) {
          this.innerHTML = '';
          return;
        }

        // 1. Build batched handle query
        const queryToFetch = recentlyViewed.slice(0, this.limit);
        const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));
        
        // 2. Fetch headless search template
        const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&view=recently-viewed`;

        const response = await fetch(searchUrl);
        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;

        // 3. Extract the product grid list
        const productGrid = html.querySelector('.grid.product-grid');
        
        if (productGrid && productGrid.children.length > 0) {
          // 4. Sort nodes to match the exact chronological sequence in our array
          const sortedNodes = [];
          queryToFetch.forEach(handle => {
            const matchedNode = Array.from(productGrid.children).find(
              node => node.getAttribute('data-handle') === handle
            );
            if (matchedNode) sortedNodes.push(matchedNode);
          });

          // 5. Clear and inject
          productGrid.innerHTML = '';
          sortedNodes.forEach(node => productGrid.appendChild(node));

          this.innerHTML = '';
          // Extract the full slider component if it exists
          const sliderComponent = html.querySelector('slider-component') || productGrid;
          this.appendChild(sliderComponent);
          this.removeAttribute('hidden');
        } else {
          this.innerHTML = '';
        }
      } catch (e) {
        console.error('Failed to load recently viewed products', e);
        this.innerHTML = '';
      }
    }
  }
  customElements.define('recently-viewed-products', RecentlyViewedProducts);
}
