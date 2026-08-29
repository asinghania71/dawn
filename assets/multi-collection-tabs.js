if (!customElements.get('multi-collection-tabs')) {
  customElements.define('multi-collection-tabs', class MultiCollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('.multi-collection-tabs__button');
      this.container = this.querySelector('#MultiCollectionGridContainer');
      this.viewAllLink = this.querySelector('.multi-collection-tabs__view-all');
      
      this.currentCollectionUrl = this.buttons.length > 0 ? this.buttons[0].getAttribute('data-url') : '';
      this.cache = {};
      
      this.bindEvents();
    }

    connectedCallback() {
      // Immediately load the first collection to ensure it has filters and sorting
      if (this.currentCollectionUrl) {
        this.loadCollection(this.currentCollectionUrl, true);
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
      
      const url = clickedButton.getAttribute('data-url');
      if (this.viewAllLink && url) {
        this.viewAllLink.href = url;
      }
      
      this.currentCollectionUrl = url;

      clickedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      this.loadCollection(url, true);
    }

    getFetchUrl(baseUrl) {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set('section_id', 'multi-collection-ajax');
      return url.toString();
    }

    loadCollection(url, useCache) {
      if (!url) return;
      this.container.classList.add('loading');
      
      const fetchUrl = this.getFetchUrl(url);

      if (useCache && this.cache[fetchUrl]) {
        this.injectHTML(this.cache[fetchUrl]);
        return;
      }

      fetch(fetchUrl)
        .then(response => response.text())
        .then(html => {
          if (useCache) this.cache[fetchUrl] = html;
          this.injectHTML(html);
        })
        .catch(error => {
          console.error('Failed to load collection:', error);
          this.container.classList.remove('loading');
        });
    }

    injectHTML(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const sectionContent = doc.querySelector('.multi-collection-ajax-wrapper');
      
      if (sectionContent) {
        this.container.innerHTML = sectionContent.innerHTML;
        
        // Upgrade all custom elements
        const customElementsList = this.container.querySelectorAll('*');
        customElementsList.forEach(el => {
           if (el.tagName.includes('-') && typeof window.customElements !== 'undefined') {
               window.customElements.upgrade(el);
           }
        });
      }
      
      this.container.classList.remove('loading');
    }
  });
}
