if (!customElements.get('shoppable-short')) {
  class ShoppableShort extends HTMLElement {
    constructor() {
      super();
      this.hasLoaded = false;
      this.isPlaying = false;
    }
    
    connectedCallback() {
      this.card = this.querySelector('.shoppable-short-card');
      this.poster = this.querySelector('.shoppable-short-card__poster');
      this.iframeWrapper = this.querySelector('.shoppable-short-card__iframe-wrapper');
      
      this.url = this.dataset.url;
      this.autoplay = this.dataset.autoplay === 'true';
      
      this.initObserver();
      
      if (this.poster && !this.autoplay) {
        this.playHandler = this.play.bind(this);
        this.keydownHandler = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.playHandler();
          }
        };
        this.poster.addEventListener('click', this.playHandler);
        this.poster.addEventListener('keydown', this.keydownHandler);
      }
    }
    
    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.poster && this.playHandler) {
        this.poster.removeEventListener('click', this.playHandler);
        this.poster.removeEventListener('keydown', this.keydownHandler);
      }
    }
    
    initObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!this.hasLoaded) {
              this.loadIframe();
            }
            if (this.autoplay && !this.isPlaying) {
              this.play();
            }
          } else {
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
      
      // YouTube Shorts & standard video parsing
      const ytShortMatch = this.url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
      const ytWatchMatch = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      
      if (ytShortMatch || ytWatchMatch) {
        const id = ytShortMatch ? ytShortMatch[1] : ytWatchMatch[1];
        
        // Auto-fetch YouTube thumbnail if no poster was provided
        if (this.dataset.hasPoster === 'false' && this.poster) {
          this.poster.style.backgroundImage = `url('https://i.ytimg.com/vi/${id}/maxresdefault.jpg'), url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')`;
          const svg = this.poster.querySelector('svg');
          if (svg) svg.style.display = 'none';
        }
        
        let embedUrl = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1`;
        if (this.autoplay) {
          embedUrl += '&mute=1';
        }
        return embedUrl;
      }
      
      return null;
    }
    
    loadIframe() {
      const src = this.parseUrl();
      if (src && this.iframeWrapper) {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        this.iframeWrapper.appendChild(iframe);
        this.iframe = iframe;
      }
      this.hasLoaded = true;
    }
    
    play() {
      if (!this.hasLoaded) {
        this.loadIframe();
      } else if (this.iframe && (this.iframe.src === '' || this.iframe.src === window.location.href)) {
        this.iframe.src = this.iframe.dataset.src || this.parseUrl();
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
      
      if (this.iframe) {
        if (!this.iframe.dataset.src) {
          this.iframe.dataset.src = this.iframe.src;
        }
        this.iframe.src = '';
      }
    }
  }
  
  customElements.define('shoppable-short', ShoppableShort);
}
