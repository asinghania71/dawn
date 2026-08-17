class SPARouter {
  constructor() {
    this.scrollPositions = {};
    this.initLoadingBar();
    this.bindEvents();
    
    // Add popstate listener for back/forward buttons
    window.addEventListener('popstate', (e) => {
      this.navigate(window.location.href, false);
    });
  }

  initLoadingBar() {
    if (!document.querySelector('.spa-loading-bar')) {
      this.loadingBar = document.createElement('div');
      this.loadingBar.className = 'spa-loading-bar';
      document.body.appendChild(this.loadingBar);
    } else {
      this.loadingBar = document.querySelector('.spa-loading-bar');
    }
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      // Find the closest anchor tag
      const link = e.target.closest('a');

      // If no link, or modifier keys are pressed (cmd/ctrl click), let default happen
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // If the event was already handled by another script (e.g. opening a drawer/modal), ignore it
      if (e.defaultPrevented) return;

      // Check if it's an internal link
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;

      // Ignore anchor links on the same page
      if (url.pathname === window.location.pathname && url.hash) return;
      if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) return;

      // Ignore links meant for new tabs or explicitly ignoring SPA
      if (link.target === '_blank' || link.hasAttribute('data-no-spa')) return;

      // Ignore checkout links as they are external
      if (url.pathname.startsWith('/checkout')) {
         return;
      }

      // Intercept!
      e.preventDefault();
      this.navigate(url.href, true);
    });
  }

  async navigate(url, pushState = true) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      // Save current scroll position before navigating
      this.scrollPositions[window.location.pathname] = window.scrollY;

      // Start Loading
      this.loadingBar.classList.remove('is-finishing');
      this.loadingBar.classList.add('is-loading');
      document.body.classList.add('is-spa-loading');

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const htmlText = await response.text();
      
      // Parse HTML
      const parser = new DOMParser();
      const newDocument = parser.parseFromString(htmlText, 'text/html');
      
      const currentMain = document.getElementById('MainContent');
      const newMain = newDocument.getElementById('MainContent');

      if (currentMain && newMain) {
        // Swap content
        currentMain.innerHTML = newMain.innerHTML;
        
        // Update Title
        document.title = newDocument.title;
        
        // Push State
        if (pushState) {
          window.history.pushState(null, document.title, url);
        }

        // Re-evaluate scripts within the new main content
        this.reEvaluateScripts(currentMain);

        // Update active states (like sticky bottom nav)
        this.updateActiveLinks();

        // Manage scroll positions
        const newPathname = new URL(url).pathname;
        if (pushState) {
          // If we are clicking a new link, scroll to its saved position or top
          if (this.scrollPositions[newPathname] !== undefined) {
            window.scrollTo(0, this.scrollPositions[newPathname]);
          } else {
            window.scrollTo(0, 0);
          }
        } else {
          // If it's a popstate (browser back/forward), restore position
          if (this.scrollPositions[newPathname] !== undefined) {
            window.scrollTo(0, this.scrollPositions[newPathname]);
          } else {
            window.scrollTo(0, 0);
          }
        }

        // Finish Loading
        this.finishLoading();
      } else {
        // Fallback: If no MainContent found, hard redirect
        window.location.href = url;
      }
    } catch (error) {
      console.error('SPA Navigation Error:', error);
      // Fallback to hard reload on error
      window.location.href = url;
    } finally {
      this.isNavigating = false;
    }
  }

  reEvaluateScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      // Don't re-evaluate JSON data scripts
      if (oldScript.type && (oldScript.type === 'application/json' || oldScript.type === 'application/ld+json')) {
        return;
      }
      
      // Deduplicate external scripts
      if (oldScript.src && document.head.querySelector(`script[src="${oldScript.src}"]`)) {
        return;
      }
      
      const newScript = document.createElement('script');
      
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      
      oldScript.parentNode.replaceChild(newScript, oldScript);
      
      // Move new external scripts to head to prevent duplicate injection on next navigate
      if (newScript.src) {
        document.head.appendChild(newScript);
      }
    });
  }

  updateActiveLinks() {
    const currentPath = window.location.pathname;
    
    // Update sticky bottom nav
    const stickyNavItems = document.querySelectorAll('.sticky-bottom-nav__item');
    stickyNavItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href) {
        // Remove origin if present for relative comparison
        const relativeHref = href.replace(window.location.origin, '');
        if (relativeHref === currentPath) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      }
    });

    // We can also update header links if needed here
  }

  finishLoading() {
    this.loadingBar.classList.remove('is-loading');
    this.loadingBar.classList.add('is-finishing');
    document.body.classList.remove('is-spa-loading');
    
    setTimeout(() => {
      this.loadingBar.classList.remove('is-finishing');
    }, 300);
  }
}

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SPARouter();
  });
} else {
  new SPARouter();
}
