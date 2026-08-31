if (!customElements.get('multi-collection-tabs')) {
  customElements.define('multi-collection-tabs', class MultiCollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('.multi-collection-tabs__button');
      this.container = this.querySelector('#MultiCollectionGridContainer');
      this.viewAllLink = this.querySelector('.multi-collection-tabs__view-all');
      this.paginationType = this.getAttribute('data-pagination-type') || 'pages';
      
      this.currentCollectionUrl = this.buttons.length > 0 ? this.buttons[0].getAttribute('data-url') : '';
      this.cache = {};
      
      this.bindEvents();
    }

    connectedCallback() {
      // Immediately load the first collection
      if (this.currentCollectionUrl) {
        this.loadCollection(this.currentCollectionUrl, true);
      }
    }

    bindEvents() {
      this.buttons.forEach((button) => {
        button.addEventListener('click', (event) => this.onTabClick(event));
      });

      this.container.addEventListener('click', (event) => {
        // Handle "Load More" button clicks
        if (event.target.classList.contains('btn-load-more')) {
          event.preventDefault();
          const url = event.target.getAttribute('data-url');
          if (url) {
            event.target.innerHTML = '<div class="loading-overlay__spinner" style="width: 2rem; display: inline-block;"><svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg></div>';
            this.loadMore(url, event.target);
          }
        }
        
        // Handle standard pagination clicks to stay inside the widget
        const pageLink = event.target.closest('.pagination__item');
        if (pageLink && pageLink.tagName === 'A' && this.paginationType === 'pages') {
          event.preventDefault();
          const url = pageLink.href;
          if (url) {
            this.currentCollectionUrl = url;
            this.loadCollection(url, false);
          }
        }
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

    loadMore(url, triggerElement) {
      const fetchUrl = this.getFetchUrl(url);
      
      fetch(fetchUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const newGridItems = doc.querySelectorAll('#product-grid .grid__item');
          const currentGrid = this.container.querySelector('#product-grid');
          
          if (newGridItems.length > 0 && currentGrid) {
            newGridItems.forEach(item => currentGrid.appendChild(item));
          }
          
          if (triggerElement) triggerElement.remove();
          
          const newPaginationWrapper = doc.querySelector('.pagination-wrapper');
          if (newPaginationWrapper) {
            const targetGridContainer = this.container.querySelector('.product-grid-container') || this.container;
            
            // Remove old custom pagination wrapper if exists
            const oldWrapper = targetGridContainer.querySelector('.pagination-wrapper');
            if (oldWrapper) oldWrapper.remove();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newPaginationWrapper.outerHTML;
            targetGridContainer.appendChild(tempDiv.firstElementChild);
            this.applyCustomPagination();
          }
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
        
        this.applyCustomPagination();
      }
      
      this.container.classList.remove('loading');
    }

    applyCustomPagination() {
      const paginationWrapper = this.container.querySelector('.pagination-wrapper');
      if (!paginationWrapper) return;
      if (paginationWrapper.hasAttribute('data-customized')) return;
      
      paginationWrapper.setAttribute('data-customized', 'true');

      if (this.paginationType === 'pages') return;

      const listItems = paginationWrapper.querySelectorAll('.pagination__list li');
      if (!listItems || listItems.length === 0) return;
      
      const lastLi = listItems[listItems.length - 1];
      const nextLink = lastLi.querySelector('a.pagination__item-arrow');
      
      if (!nextLink) {
        paginationWrapper.style.display = 'none';
        return;
      }
      
      const nextUrl = nextLink.getAttribute('href');
      
      if (this.paginationType === 'load_more') {
        paginationWrapper.innerHTML = `<div class="center margin-top-1rem"><button type="button" class="button button--secondary btn-load-more" data-url="${nextUrl}">Load More</button></div>`;
      } else if (this.paginationType === 'infinite') {
        paginationWrapper.innerHTML = `<infinite-scroll data-next-url="${nextUrl}"><div class="loading-overlay__spinner" style="width: 100%; text-align: center; padding: 2rem 0;"><svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg></div></infinite-scroll>`;
      }
    }
  });
}
