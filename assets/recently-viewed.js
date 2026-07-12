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
      
      // Keep only the last 12
      if (recentlyViewed.length > 12) {
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
        let recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
        
        if (recentlyViewed.length === 0) {
          this.innerHTML = '';
          return;
        }

        // 0. Filter out current product
        const currentTracker = document.querySelector('product-tracker');
        const currentHandle = currentTracker ? currentTracker.dataset.productHandle : null;
        if (currentHandle) {
          recentlyViewed = recentlyViewed.filter(handle => handle !== currentHandle);
        }

        // 1. Build batched handle query
        const queryToFetch = recentlyViewed.slice(0, this.limit);
        const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));
        
        // 2. Fetch section HTML using Section Rendering API
        const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&section_id=${this.dataset.sectionId}`;

        const response = await fetch(searchUrl);
        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;

        // 3. Extract the product grid list from the rendered section
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

          // 5. Clear and inject into existing grid
          const existingGrid = this.querySelector('.grid');
          if (existingGrid) {
            const isSlider = existingGrid.classList.contains('slider');
            existingGrid.innerHTML = '';
            sortedNodes.forEach(node => {
              if (isSlider) node.classList.add('slider__slide');
              existingGrid.appendChild(node);
            });
            this.removeAttribute('hidden');
          }
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
