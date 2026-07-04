class WishlistDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      if (event.target === this) this.close();
    });
    
    // Listen for global custom events to open the drawer
    window.addEventListener('wishlist:open', this.open.bind(this));
    // Listen for wishlist updates to refresh content if drawer is open
    window.addEventListener('wishlist:updated', () => {
      if (this.classList.contains('active')) {
        this.fetchWishlist();
      }
    });
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
    const wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
    
    if (wishlist.length === 0) {
      contentContainer.innerHTML = '<p class="center" style="margin-top: 3rem;">Your wishlist is empty. Add some items you love!</p>';
      return;
    }

    contentContainer.innerHTML = `
      <div class="wishlist-drawer__loading">
        <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
          <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
        </svg>
      </div>
    `;

    // 1. Build batched handle query
    const queryToFetch = wishlist.slice(0, 50); // limit to 50
    const query = encodeURIComponent(queryToFetch.map(handle => `handle:${handle}`).join(' OR '));
    
    // 2. Fetch headless search template
    const searchUrl = `${(window.routes && window.routes.search_url) || '/search'}?q=${query}&type=product&view=recently-viewed`;

    try {
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
        contentContainer.innerHTML = '';
        
        // We inject the grid directly into the drawer content
        const newGrid = document.createElement('div');
        newGrid.className = productGrid.className;
        sortedNodes.forEach(node => newGrid.appendChild(node));
        contentContainer.appendChild(newGrid);
        
      } else {
        contentContainer.innerHTML = '<p class="center" style="margin-top: 3rem;">No active products found in your wishlist.</p>';
      }
    } catch (e) {
      console.error('Error fetching wishlist for drawer:', e);
      contentContainer.innerHTML = '<p class="center" style="margin-top: 3rem;">Error loading wishlist.</p>';
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
