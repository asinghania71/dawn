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

if (!customElements.get('recently-viewed-products')) {
  class RecentlyViewedProducts extends HTMLElement {
    constructor() {
      super();
      this.limit = parseInt(this.dataset.limit) || 4;
      this.init();
    }

    _hideSection() {
      if (document.body.classList.contains('shopify-design-mode') || window.Shopify?.designMode) return;
      const sectionEl = this.closest('.shopify-section') || document.getElementById(`shopify-section-${this.dataset.sectionId}`);
      if (sectionEl) sectionEl.classList.remove('is-active');
      const wrapper = this.closest('.recently-viewed-section') || document.getElementById(`recently-viewed-wrapper-${this.dataset.sectionId}`);
      if (wrapper) wrapper.classList.remove('is-active');
    }

    _showSection() {
      const sectionEl = this.closest('.shopify-section') || document.getElementById(`shopify-section-${this.dataset.sectionId}`);
      if (sectionEl) sectionEl.classList.add('is-active');
      const wrapper = this.closest('.recently-viewed-section') || document.getElementById(`recently-viewed-wrapper-${this.dataset.sectionId}`);
      if (wrapper) wrapper.classList.add('is-active');
    }

    async init() {
      try {
        let recentlyViewed = [];
        try {
          recentlyViewed = JSON.parse(localStorage.getItem('dawn_recently_viewed') || '[]');
          if (!Array.isArray(recentlyViewed)) recentlyViewed = [];
        } catch (e) {
          recentlyViewed = [];
        }

        // 0. Filter out current product if on a product page
        let currentHandle = null;
        const currentTracker = document.querySelector('product-tracker');
        if (currentTracker && currentTracker.dataset.productHandle) {
          currentHandle = currentTracker.dataset.productHandle;
        } else if (window.location.pathname.includes('/products/')) {
          const parts = window.location.pathname.split('/products/');
          if (parts[1]) {
            currentHandle = parts[1].split('/')[0].split('?')[0];
          }
        }
        if (currentHandle) {
          recentlyViewed = recentlyViewed.filter(handle => handle !== currentHandle);
        }

        // If no recently viewed products remain, hide section and exit immediately
        if (recentlyViewed.length === 0) {
          this.innerHTML = '';
          this._hideSection();
          return;
        }

        // 1. Build batched handle query
        const queryToFetch = recentlyViewed.slice(0, this.limit);
        if (queryToFetch.length === 0) {
          this.innerHTML = '';
          this._hideSection();
          return;
        }

        const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));

        // 2. Fetch section HTML using search.recently-viewed template
        const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&view=recently-viewed`;

        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;

        // 3. Extract the product grid list from the rendered template
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

          if (sortedNodes.length > 0) {
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
              this._showSection();

              const sliderComponent = this.querySelector('slider-component');
              if (sliderComponent && typeof sliderComponent.resetPages === 'function') {
                sliderComponent.resetPages();
              }
            } else {
              this._hideSection();
            }
          } else {
            this.innerHTML = '';
            this._hideSection();
          }
        } else {
          this.innerHTML = '';
          this._hideSection();
        }
      } catch (e) {
        console.error('Failed to load recently viewed products', e);
        this.innerHTML = '';
        this._hideSection();
      }
    }
  }
  customElements.define('recently-viewed-products', RecentlyViewedProducts);
}
