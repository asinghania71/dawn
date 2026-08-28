if (!customElements.get('multi-collection-tabs')) {
  customElements.define('multi-collection-tabs', class MultiCollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('.multi-collection-tabs__button');
      this.container = this.querySelector('#MultiCollectionGridContainer');
      this.paginationType = this.getAttribute('data-pagination-type') || 'load_more';
      this.viewAllLink = this.querySelector('.multi-collection-tabs__view-all');
      this.cache = {};
      
      this.bindEvents();
      
      // Always fetch the first collection from the server to get the full
      // main-collection-product-grid section with the correct layout.
      if (this.buttons.length > 0) {
        this.loadCollection(this.buttons[0].getAttribute('data-url'), true);
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const trigger = entry.target;
            const url = trigger.getAttribute('data-url');
            if (url) {
              this.observer.unobserve(trigger);
              this.loadMore(url, trigger);
            }
          }
        });
      }, { rootMargin: '0px 0px 400px 0px' });
    }

    bindEvents() {
      this.buttons.forEach((button) => {
        button.addEventListener('click', (event) => this.onTabClick(event));
      });

      this.container.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-load-more')) {
          event.preventDefault();
          const url = event.target.getAttribute('data-url');
          if (url) {
            event.target.innerHTML = '<div class="loading-overlay__spinner"><svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg></div>';
            this.loadMore(url, event.target);
          }
        }
        
        const pageLink = event.target.closest('.pagination__item');
        if (pageLink && pageLink.tagName === 'A' && this.paginationType === 'pages') {
          event.preventDefault();
          const url = pageLink.href;
          if (url) this.loadCollection(url, false);
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

      clickedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      this.loadCollection(url, true);
    }

    getFetchUrl(baseUrl) {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set('section_id', 'main-collection-product-grid');
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
          
          const newGrid = doc.querySelector('#product-grid');
          const currentGrid = this.container.querySelector('#product-grid');
          
          if (newGrid && currentGrid) {
            currentGrid.innerHTML += newGrid.innerHTML;
          }
          
          if (triggerElement) triggerElement.remove();
          
          const newPaginationWrapper = doc.querySelector('.pagination-wrapper');
          if (newPaginationWrapper) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newPaginationWrapper.outerHTML;
            const targetGridContainer = this.container.querySelector('.product-grid-container') || this.container;
            targetGridContainer.appendChild(tempDiv.firstElementChild);
            this.applyCustomPagination();
          }
        });
    }

    injectHTML(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const sectionNode = doc.querySelector('.shopify-section > div[class*="-padding"]');
      if (sectionNode) {
        this.container.innerHTML = sectionNode.innerHTML;
      }
      
      this.applyCustomPagination();
      this.container.classList.remove('loading');
    }
    
    applyCustomPagination() {
      const paginationWrapper = this.container.querySelector('.pagination-wrapper');
      if (!paginationWrapper) return;
      
      if (paginationWrapper.hasAttribute('data-customized')) return;
      paginationWrapper.setAttribute('data-customized', 'true');

      if (this.paginationType === 'none') {
        paginationWrapper.style.display = 'none';
        return;
      }

      if (this.paginationType === 'pages') {
        return;
      }

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
        paginationWrapper.innerHTML = `<div class="center margin-top-1rem infinite-scroll-trigger" data-url="${nextUrl}"><div class="loading-overlay__spinner"><svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg></div></div>`;
        const trigger = paginationWrapper.querySelector('.infinite-scroll-trigger');
        if (trigger) this.observer.observe(trigger);
      }
    }
  });
}

