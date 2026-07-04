class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.dataset.nextUrl) {
          this.loadNextPage();
        }
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.isLoading = false;
  }

  connectedCallback() {
    if (this.dataset.nextUrl) {
      this.observer.observe(this);
    } else {
      this.style.display = 'none';
    }
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  async loadNextPage() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const response = await fetch(this.dataset.nextUrl);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const newGridItems = doc.querySelectorAll('#product-grid .grid__item');
      const currentGrid = document.querySelector('#product-grid');

      if (currentGrid && newGridItems.length > 0) {
        newGridItems.forEach((item) => currentGrid.appendChild(item));
      }

      const newInfiniteScroll = doc.querySelector('infinite-scroll');
      if (newInfiniteScroll && newInfiniteScroll.dataset.nextUrl) {
        this.dataset.nextUrl = newInfiniteScroll.dataset.nextUrl;
      } else {
        this.removeAttribute('data-next-url');
        this.observer.disconnect();
        this.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to load next page for infinite scroll', error);
    } finally {
      this.isLoading = false;
    }
  }
}

customElements.define('infinite-scroll', InfiniteScroll);
