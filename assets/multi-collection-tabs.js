if (!customElements.get('multi-collection-tabs')) {
  customElements.define('multi-collection-tabs', class MultiCollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.buttons = this.querySelectorAll('.multi-collection-tabs__button');
      this.container = this.querySelector('#MultiCollectionGridContainer');
      this.paginationType = this.getAttribute('data-pagination-type') || 'load_more';
      this.cache = {};
      
      this.bindEvents();
      
      const hasInitialGrid = this.container && this.container.querySelector('#product-grid');
      if (this.buttons.length > 0 && !hasInitialGrid) {
        this.loadCollection(this.buttons[0].getAttribute('data-url'), true);
      } else if (hasInitialGrid && this.buttons.length > 0) {
        const initialUrl = this.buttons[0].getAttribute('data-url');
        if (initialUrl) {
          const parsedUrl = new URL(initialUrl, window.location.origin);
          parsedUrl.searchParams.set('section_id', 'main-collection-product-grid');
          const fetchUrl = parsedUrl.toString();
          this.cache[fetchUrl] = this.container.innerHTML;
        }
        this.applyCustomPagination();
        this.startObservingFacets();
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

      // Observe DOM changes caused by facets.js (filter/sort)
      this.mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if pagination wrapper was added or replaced
            const hasPagination = Array.from(mutation.addedNodes).some(node => 
              node.classList && (node.classList.contains('pagination-wrapper') || node.querySelector?.('.pagination-wrapper'))
            );
            
            if (hasPagination) {
              this.applyCustomPagination();
            }
          }
        }
      });
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
      
      clickedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      this.loadCollection(clickedButton.getAttribute('data-url'), true);
    }

    loadCollection(url, useCache) {
      if (!url) return;
      this.container.classList.add('loading');
      
      const parsedUrl = new URL(url, window.location.origin);
      parsedUrl.searchParams.set('section_id', 'main-collection-product-grid');
      const fetchUrl = parsedUrl.toString();

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
      // Disconnect mutation observer briefly so our manual appending doesn't trigger it recursively
      this.mutationObserver.disconnect();
      
      const parsedUrl = new URL(url, window.location.origin);
      parsedUrl.searchParams.set('section_id', 'main-collection-product-grid');
      const fetchUrl = parsedUrl.toString();
      
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
            this.container.querySelector('#ProductGridContainer').appendChild(tempDiv.firstElementChild);
            this.applyCustomPagination();
          }
          
          this.startObservingFacets();
        })
        .catch(() => {
          this.startObservingFacets();
        });
    }

    injectHTML(html) {
      this.mutationObserver.disconnect();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newSection = doc.querySelector('.shopify-section');
      if (newSection) {
        this.container.innerHTML = newSection.innerHTML;
        this.applyCustomPagination();
        this.startObservingFacets();
      }
      this.container.classList.remove('loading');
    }
    
    startObservingFacets() {
      const productGridContainer = this.container.querySelector('#ProductGridContainer');
      if (productGridContainer) {
        this.mutationObserver.observe(productGridContainer, { childList: true, subtree: true });
      }
    }

    applyCustomPagination() {
      const paginationWrapper = this.container.querySelector('.pagination-wrapper');
      if (!paginationWrapper) return;
      
      // If already processed, skip
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
      
      const nextUrl = nextLink.href;
      
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
