if (!customElements.get('multi-collection-tabs')) {
  customElements.define('multi-collection-tabs', class MultiCollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('.multi-collection-tabs__button');
      this.container = this.querySelector('#MultiCollectionGridContainer');
      this.cache = {}; // Cache HTML strings by URL
      
      this.bindEvents();
      
      // Load the first tab automatically on init
      if (this.buttons.length > 0) {
        this.loadCollection(this.buttons[0]);
      }
    }

    bindEvents() {
      this.buttons.forEach((button) => {
        button.addEventListener('click', (event) => this.onTabClick(event));
      });
    }

    onTabClick(event) {
      const clickedButton = event.currentTarget;
      if (clickedButton.classList.contains('active')) return;
      
      this.buttons.forEach((button) => {
        if (button === clickedButton) {
          button.classList.add('active');
          button.setAttribute('aria-selected', 'true');
        } else {
          button.classList.remove('active');
          button.setAttribute('aria-selected', 'false');
        }
      });
      
      clickedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      this.loadCollection(clickedButton);
    }

    loadCollection(button) {
      const url = button.getAttribute('data-url');
      if (!url) return;

      this.container.classList.add('loading');
      
      if (this.cache[url]) {
        this.injectHTML(this.cache[url]);
        return;
      }

      fetch(`${url}?section_id=main-collection-product-grid`)
        .then(response => response.text())
        .then(html => {
          this.cache[url] = html;
          this.injectHTML(html);
        })
        .catch(error => {
          console.error('Failed to load collection:', error);
          this.container.classList.remove('loading');
        });
    }

    injectHTML(html) {
      // Parse the returned section
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract the product grid and facets. In Dawn, it's the section wrapper.
      const newSection = doc.querySelector('.shopify-section');
      if (newSection) {
        this.container.innerHTML = newSection.innerHTML;
        
        // Re-initialize any facet scripts (since they were added dynamically)
        if (typeof FacetFiltersForm !== 'undefined') {
          // If there's a facet form, we don't need to do much as custom elements self-initialize,
          // but we may need to manually trigger scripts if they aren't custom elements.
        }
      }
      this.container.classList.remove('loading');
    }
  });
}
