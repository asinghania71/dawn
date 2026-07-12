if (!customElements.get('wishlist-button')) {
  class WishlistButton extends HTMLElement {
    constructor() {
      super();
      this.btn = this.querySelector('button');
      this.productHandle = this.dataset.productHandle;

      if (!this.productHandle) return;

      this.checkStatus();
      this.btn.addEventListener('click', this.toggleWishlist.bind(this));
      window.addEventListener('wishlist:updated', this.checkStatus.bind(this));
    }

    checkStatus() {
      const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
      const inWishlist = wishlist.includes(this.productHandle);
      this.btn.setAttribute('aria-pressed', inWishlist.toString());
      if (inWishlist) {
        this.classList.add('wishlist-button--active');
      } else {
        this.classList.remove('wishlist-button--active');
      }
    }

    toggleWishlist() {
      let wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
      const index = wishlist.indexOf(this.productHandle);

      if (index === -1) {
        wishlist.unshift(this.productHandle);
      } else {
        wishlist.splice(index, 1);
      }

      localStorage.setItem('dawn_wishlist', JSON.stringify(wishlist));
      window.dispatchEvent(new Event('wishlist:updated'));
    }
  }
  customElements.define('wishlist-button', WishlistButton);
}

if (!customElements.get('wishlist-products')) {
  class WishlistProducts extends HTMLElement {
    constructor() {
      super();
      this.init();
      window.addEventListener('wishlist:updated', this.init.bind(this));
    }

    async init() {
      try {
        const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
        
        if (wishlist.length === 0) {
          this.innerHTML = '<p class="center" style="margin: 3rem 0;">Your wishlist is empty.</p>';
          this.removeAttribute('hidden');
          return;
        }

        // 1. Build batched handle query
        const queryToFetch = wishlist.slice(0, 50); // limit to 50 for search bounds
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

          // 5. Clear and inject into existing grid
          const existingGrid = this.querySelector('.grid');
          if (existingGrid) {
            existingGrid.innerHTML = '';
            sortedNodes.forEach((node, index) => {
              // Add required attributes for slider-component compatibility
              node.id = `Slide-wishlist-${index + 1}`;
              node.classList.add('slider__slide');
              existingGrid.appendChild(node);
            });
            this.removeAttribute('hidden');
            
            // Re-initialize slider if it exists
            const sliderComponent = this.querySelector('slider-component');
            if (sliderComponent && typeof sliderComponent.resetPages === 'function') {
              sliderComponent.resetPages();
            }
          }
        } else {
          this.innerHTML = '<p class="center" style="margin: 3rem 0;">No active products found in your wishlist.</p>';
          this.removeAttribute('hidden');
        }
      } catch (e) {
        console.error('Failed to load wishlist products', e);
        this.innerHTML = '<p class="center" style="margin: 3rem 0;">Failed to load wishlist.</p>';
        this.removeAttribute('hidden');
      }
    }
  }
  customElements.define('wishlist-products', WishlistProducts);
}
