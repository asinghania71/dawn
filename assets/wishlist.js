class WishlistButton extends HTMLElement {
  constructor() {
    super();
    this.productId = this.dataset.productId;
    this.button = this.querySelector('button');
    
    if (this.button) {
      this.button.addEventListener('click', this.toggleWishlist.bind(this));
    }
  }

  connectedCallback() {
    this.updateState();
    window.addEventListener('wishlist:updated', this.updateState.bind(this));
  }

  getWishlist() {
    return JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
  }

  toggleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    
    let wishlist = this.getWishlist();
    if (wishlist.includes(this.productId)) {
      wishlist = wishlist.filter(id => id !== this.productId);
    } else {
      wishlist.push(this.productId);
    }
    
    localStorage.setItem('dawn_wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlist:updated'));
  }

  updateState() {
    const wishlist = this.getWishlist();
    if (wishlist.includes(this.productId)) {
      this.classList.add('wishlist-button--active');
      if (this.button) this.button.setAttribute('aria-pressed', 'true');
    } else {
      this.classList.remove('wishlist-button--active');
      if (this.button) this.button.setAttribute('aria-pressed', 'false');
    }
  }
}
customElements.define('wishlist-button', WishlistButton);

class WishlistProducts extends HTMLElement {
  async connectedCallback() {
    const sectionId = this.dataset.sectionId;
    if (!sectionId) return;

    let wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
    
    if (wishlist.length === 0) {
      this.style.display = 'block';
      this.innerHTML = '<p class="center">Your wishlist is empty. Browse our products and add them to your wishlist!</p>';
      return;
    }

    const query = wishlist.map(id => `id:${id}`).join(' OR ');
    const searchUrl = `${window.routes ? window.routes.search_url : '/search'}?q=${query}&type=product&section_id=${sectionId}`;

    try {
      const response = await fetch(searchUrl);
      const text = await response.text();
      const html = document.createElement('div');
      html.innerHTML = text;

      const newContent = html.querySelector('wishlist-products');
      if (newContent && newContent.innerHTML.trim().length > 0) {
        this.innerHTML = newContent.innerHTML;
        this.removeAttribute('hidden');
      } else {
        this.innerHTML = '<p class="center">No products found in your wishlist.</p>';
      }
    } catch (e) {
      console.error('Error fetching wishlist products:', e);
      this.innerHTML = '<p class="center">An error occurred while loading your wishlist.</p>';
    }
    
    window.addEventListener('wishlist:updated', this.handleUpdate.bind(this));
  }
  
  handleUpdate() {
    let wishlist = JSON.parse(localStorage.getItem('dawn_wishlist') || '[]');
    if (wishlist.length === 0) {
      this.innerHTML = '<p class="center">Your wishlist is empty. Browse our products and add them to your wishlist!</p>';
    } else {
      const items = this.querySelectorAll('.grid__item');
      items.forEach(item => {
        const btn = item.querySelector('wishlist-button');
        if (btn && !wishlist.includes(btn.dataset.productId)) {
           item.remove();
        }
      });
    }
  }
}
customElements.define('wishlist-products', WishlistProducts);
