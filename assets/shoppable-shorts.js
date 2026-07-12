if (!customElements.get('shoppable-short')) {
  class ShoppableShort extends HTMLElement {
    constructor() {
      super();
      this.card = this.querySelector('.shoppable-short-card');
      this.poster = this.querySelector('.shoppable-short-card__poster');
      this.iframeWrapper = this.querySelector('.shoppable-short-card__iframe-wrapper');
      
      this.url = this.dataset.url;
      this.autoplay = this.dataset.autoplay === 'true';
      this.hasLoaded = false;
      this.isPlaying = false;
      
      this.initObserver();
      
      if (this.poster && !this.autoplay) {
        this.poster.addEventListener('click', this.play.bind(this));
      }
    }
    
    initObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Lazy load the iframe when it enters the viewport
            if (!this.hasLoaded) {
              this.loadIframe();
            }
            
            // Autoplay if setting is enabled
            if (this.autoplay && !this.isPlaying) {
              this.play();
            }
          } else {
            // Pause/reset if it leaves viewport to save resources
            if (this.autoplay && this.isPlaying) {
              this.pause();
            }
          }
        });
      }, { threshold: 0.3 });
      
      this.observer.observe(this);
    }
    
    parseUrl() {
      if (!this.url) return null;
      
      // YouTube Shorts parsing
      const ytShortMatch = this.url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
      const ytWatchMatch = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      
      if (ytShortMatch || ytWatchMatch) {
        const id = ytShortMatch ? ytShortMatch[1] : ytWatchMatch[1];
        
        // Auto-fetch YouTube thumbnail if no poster was provided
        if (this.dataset.hasPoster === 'false' && this.poster) {
          // CSS layering: if maxresdefault 404s, hqdefault shows underneath it
          this.poster.style.backgroundImage = `url('https://i.ytimg.com/vi/${id}/maxresdefault.jpg'), url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')`;
          
          // Hide the fallback SVG placeholder
          const svg = this.poster.querySelector('svg');
          if (svg) svg.style.display = 'none';
        }
        
        // autoplay=1 enables play via postMessage if native click happened, loop requires playlist
        let embedUrl = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1`;
        if (this.autoplay) {
          embedUrl += '&mute=1';
        }
        return embedUrl;
      }
      
      // Instagram Reels parsing
      const igMatch = this.url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
      if (igMatch) {
        const id = igMatch[1];
        
        // If it's Instagram and no custom poster was provided, hide the fake SVG poster 
        // and just show the native IG embed immediately.
        if (this.dataset.hasPoster === 'false' && this.poster) {
          this.poster.style.display = 'none';
          this.isPlaying = true;
          if (this.card) this.card.classList.add('is-playing');
        }
        
        // Instagram requires the trailing slash on /embed/ to prevent CORS redirects
        return `https://www.instagram.com/p/${id}/embed/`;
      }
      
      return null;
    }
    
    loadIframe() {
      const src = this.parseUrl();
      if (src && this.iframeWrapper) {
        if (src.includes('instagram.com')) {
          // Use Instagram's native blockquote embed for reliability against CORS/X-Frame-Options
          const cleanUrl = src.replace('/embed/', '/');
          this.iframeWrapper.innerHTML = `
            <blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}" data-instgrm-version="14" style="background:#FFF; border:0; margin:0; max-width:100%; padding:0; width:100%; height:100%;"></blockquote>
          `;
          
          if (!window.instgrm) {
            const script = document.createElement('script');
            script.async = true;
            script.src = "//www.instagram.com/embed.js";
            document.body.appendChild(script);
          } else {
            window.instgrm.Embeds.process();
          }
          
          // CSS override to try and make the IG embed fill the space nicely
          this.iframeWrapper.style.overflow = 'hidden';
          this.iframeWrapper.style.display = 'flex';
          this.iframeWrapper.style.alignItems = 'center';
          this.iframeWrapper.style.justifyContent = 'center';
          this.iframeWrapper.style.background = '#FFF';
        } else {
          // YouTube uses standard iframe
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.setAttribute('allow', 'autoplay; encrypted-media');
          iframe.setAttribute('allowfullscreen', '');
          iframe.setAttribute('loading', 'lazy'); // Additional native lazy loading backup
          this.iframeWrapper.appendChild(iframe);
          this.iframe = iframe;
        }
      }
      this.hasLoaded = true;
    }
    
    play() {
      if (!this.hasLoaded) {
        this.loadIframe();
      }
      this.isPlaying = true;
      if (this.card) {
        this.card.classList.add('is-playing');
      }
    }
    
    pause() {
      this.isPlaying = false;
      if (this.card) {
        this.card.classList.remove('is-playing');
      }
      
      // Quick way to stop iframe video without postMessage API is to reload the iframe source
      if (this.iframe) {
        const currentSrc = this.iframe.src;
        this.iframe.src = '';
        this.iframe.src = currentSrc;
      }
    }
  }
  
  customElements.define('shoppable-short', ShoppableShort);
}
