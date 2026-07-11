class CustomProductRibbon extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Check if the global config is available
    if (window.productRibbonsConfig) {
      this.initBadge();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        if (window.productRibbonsConfig) this.initBadge();
      });
    }
  }

  initBadge() {
    const config = window.productRibbonsConfig;
    if (!config || !config.badges || config.badges.length === 0) return;

    const tagString = this.getAttribute('data-tags') || '';
    const tags = tagString.split(',').map(t => t.trim().toLowerCase());
    const metafield = this.getAttribute('data-metafield');
    
    let winningBadge = null;

    // Iterate through configured blocks in order (highest priority first)
    for (let i = 0; i < config.badges.length; i++) {
      const badgeConfig = config.badges[i];
      const triggerTag = badgeConfig.tag.trim().toLowerCase();
      
      if (tags.includes(triggerTag) || metafield === triggerTag) {
        winningBadge = badgeConfig;
        break; 
      }
    }

    if (winningBadge) {
      const sizeAttr = this.getAttribute('data-size');
      const finalSize = sizeAttr ? sizeAttr : config.size;
      this.renderBadge(winningBadge, config.position, finalSize, winningBadge.opacity);
    }
  }

  renderBadge(badge, position, size, opacity) {
    const opacityValue = opacity ? opacity / 100 : 1.0;
    const html = `
      <div class="custom-badge custom-badge--position-${position} custom-badge--size-${size}">
        <span class="custom-badge__ribbon" style="background-color: ${badge.backgroundColor}; color: ${badge.textColor}; opacity: ${opacityValue};">
          ${badge.text}
        </span>
      </div>
    `;
    this.innerHTML = html;
  }
}

if (!customElements.get('custom-product-ribbon')) {
  customElements.define('custom-product-ribbon', CustomProductRibbon);
}
