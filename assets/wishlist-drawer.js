class WishlistDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      if (event.target === this) this.close();
    });
    // Store bound refs so they can be removed in disconnectedCallback
    this._openHandler = this.open.bind(this);
    this._updatedHandler = () => {
      if (this.classList.contains('active')) {
        this.fetchWishlist();
      }
    };
  }

  connectedCallback() {
    window.addEventListener('wishlist:open', this._openHandler);
    window.addEventListener('wishlist:updated', this._updatedHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('wishlist:open', this._openHandler);
    window.removeEventListener('wishlist:updated', this._updatedHandler);
  }

  open() {
    this.classList.add('active');
    document.body.classList.add('overflow-hidden');
    this.fetchWishlist();
  }

  close() {
    this.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  }

  async fetchWishlist() {
    const contentContainer = this.querySelector('#WishlistDrawer-Content');
    // Guard: if the content container isn't in DOM, bail early
    if (!contentContainer) return;

    const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');

    const existingGrid = contentContainer.querySelector('.grid');

    if (wishlist.length === 0) {
      if (existingGrid) existingGrid.innerHTML = '<p class="center" style="grid-column: 1 / -1; margin-top: 3rem;">Your wishlist is empty. Add some items you love!</p>';
      return;
    }

    if (existingGrid) {
      existingGrid.innerHTML = `
        <div class="wishlist-drawer__loading" style="grid-column: 1 / -1; display: flex; justify-content: center; margin-top: 3rem;">
          <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg" style="width: 3.2rem; height: 3.2rem;">
            <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
          </svg>
        </div>
      `;
    }

    // Build batched handle query (limit to 50)
    const queryToFetch = wishlist.slice(0, 50);
    const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));
    const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&view=recently-viewed`;

    try {
      const response = await fetch(searchUrl);
      // Guard against non-2xx responses (404, 500 etc.) that fetch() doesn't throw for
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

        if (existingGrid) {
          existingGrid.innerHTML = '';
          sortedNodes.forEach(node => existingGrid.appendChild(node));
        }
      } else {
        if (existingGrid) existingGrid.innerHTML = '<p class="center" style="grid-column: 1 / -1; margin-top: 3rem;">No active products found in your wishlist.</p>';
      }
    } catch (e) {
      console.error('Error fetching wishlist for drawer:', e);
      const grid = contentContainer.querySelector('.grid');
      if (grid) grid.innerHTML = '<p class="center" style="grid-column: 1 / -1; margin-top: 3rem;">Error loading wishlist. Please try again.</p>';
    }
  }
}

if (!customElements.get('wishlist-drawer')) {
  customElements.define('wishlist-drawer', WishlistDrawer);
}

class WishlistDrawerOpener extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new Event('wishlist:open'));
    });
  }
}

if (!customElements.get('wishlist-drawer-opener')) {
  customElements.define('wishlist-drawer-opener', WishlistDrawerOpener);
}
