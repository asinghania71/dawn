if (!customElements.get('wishlist-button')) {
  class WishlistButton extends HTMLElement {
    constructor() {
      super();
      this.btn = this.querySelector('button');
      this.productHandle = this.dataset.productHandle;
      // Store bound ref for removal in disconnectedCallback
      this._checkStatusHandler = this.checkStatus.bind(this);
    }

    connectedCallback() {
      if (!this.productHandle) return;
      this.checkStatus();
      if (this.btn) {
        this.btn.addEventListener('click', this.toggleWishlist.bind(this));
      }
      window.addEventListener('wishlist:updated', this._checkStatusHandler);
    }

    disconnectedCallback() {
      window.removeEventListener('wishlist:updated', this._checkStatusHandler);
    }

    checkStatus() {
      const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
      const inWishlist = wishlist.includes(this.productHandle);
      if (this.btn) this.btn.setAttribute('aria-pressed', inWishlist.toString());
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
      // Store bound ref for removal in disconnectedCallback
      this._initHandler = this.init.bind(this);
    }

    connectedCallback() {
      this.init();
      window.addEventListener('wishlist:updated', this._initHandler);
    }

    disconnectedCallback() {
      window.removeEventListener('wishlist:updated', this._initHandler);
    }

    async init() {
      try {
        const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');

        if (wishlist.length === 0) {
          this.innerHTML = '<p class="center" style="margin: 3rem 0;">Your wishlist is empty.</p>';
          this.removeAttribute('hidden');
          return;
        }

        // Build batched handle query (limit to 50)
        const queryToFetch = wishlist.slice(0, 50);
        const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));
        const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&view=recently-viewed`;

        const response = await fetch(searchUrl);
        // Guard against non-2xx responses that fetch() doesn't throw for
        if (!response.ok) throw new Error(`Wishlist fetch failed: HTTP ${response.status}`);

        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;

        const productGrid = html.querySelector('.grid.product-grid');

        if (productGrid && productGrid.children.length > 0) {
          const sortedNodes = [];
          queryToFetch.forEach(handle => {
            const matchedNode = Array.from(productGrid.children).find(
              node => node.getAttribute('data-handle') === handle
            );
            if (matchedNode) sortedNodes.push(matchedNode);
          });

          const existingGrid = this.querySelector('.grid');
          if (existingGrid) {
            existingGrid.innerHTML = '';
            sortedNodes.forEach((node, index) => {
              // Use data attribute for slider tracking to avoid ID conflicts
              node.dataset.wishlistIndex = index + 1;
              node.classList.add('slider__slide');
              existingGrid.appendChild(node);
            });
            this.removeAttribute('hidden');

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

