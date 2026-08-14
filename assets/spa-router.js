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
      console.log('SPA Router clicked element:', e.target, 'Closest a:', link);
      
      // If no link, or modifier keys are pressed (cmd/ctrl click), let default happen
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // If the event was already handled by another script (e.g. opening a drawer/modal), ignore it
      if (e.defaultPrevented) {
        console.log('SPA Router: defaultPrevented is true, ignoring.');
        return;
      }

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
         console.log('SPA Router: ignoring /checkout link');
         return;
      }

      console.log('SPA Router: Intercepting and navigating to', url.href);
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
        const newPathname = new URL(url).pathname;
        const currentPathname = window.location.pathname;

        // Determine direction
        // If clicking a link to '/', or clicking back to a previous state that is closer to root
        const isBackward = !pushState || newPathname === '/' || (currentPathname.startsWith(newPathname) && currentPathname !== newPathname);
        const directionClass = isBackward ? 'is-navigating-backward' : 'is-navigating-forward';

        // Prepare scroll variables
        const currentScroll = window.scrollY;
        const targetScroll = this.scrollPositions[newPathname] || 0;
        const scrollOffset = targetScroll - currentScroll;

        // Wrap current and new content for transition
        const currentHTML = currentMain.innerHTML;
        currentMain.innerHTML = `
          <div class="spa-transition-wrapper ${directionClass}">
            <div class="spa-page spa-page--outgoing" style="--scroll-offset: ${scrollOffset}px">${currentHTML}</div>
            <div class="spa-page spa-page--incoming">${newMain.innerHTML}</div>
          </div>
        `;
        
        // Ensure height doesn't collapse during absolute positioning
        const wrapper = currentMain.querySelector('.spa-transition-wrapper');
        const incomingPage = currentMain.querySelector('.spa-page--incoming');
        const outgoingPage = currentMain.querySelector('.spa-page--outgoing');
        
        // Wait a frame for DOM to update
        requestAnimationFrame(() => {
          // Temporarily set height to max of both so footer doesn't jump
          wrapper.style.height = Math.max(outgoingPage.offsetHeight, incomingPage.offsetHeight) + 'px';

          // Shift window instantly to target scroll (outgoing page offset counteracts this visually)
          window.scrollTo(0, targetScroll);

          requestAnimationFrame(() => {
            // Trigger hardware animation
            wrapper.classList.add('is-animating');
            
            // Wait for CSS transition (400ms)
            setTimeout(() => {
              // Commit changes permanently
              currentMain.innerHTML = newMain.innerHTML;
              
              // Update Title
              document.title = newDocument.title;
              
              // Push State
              if (pushState) {
                window.history.pushState(null, document.title, url);
              }

              // Re-evaluate scripts within the new main content
              this.reEvaluateScripts(currentMain);

              // Update active states
              this.updateActiveLinks();

              // Finish Loading
              this.finishLoading();
            }, 400); // match CSS transition duration
          });
        });
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
      // Only re-evaluate standard inline scripts or specific src scripts inside main
      // Note: custom elements (web components) automatically initialize when inserted into DOM via innerHTML
      const newScript = document.createElement('script');
      
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      
      oldScript.parentNode.replaceChild(newScript, oldScript);
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
