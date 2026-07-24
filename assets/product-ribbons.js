class CustomProductRibbon extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Check if the global config is available
    if (window.productRibbonsConfig) {
      this.initBadge();
    } else {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
          if (window.productRibbonsConfig) this.initBadge();
        });
      } else {
        if (window.productRibbonsConfig) this.initBadge();
      }
    }
  }

  initBadge() {
    const config = window.productRibbonsConfig;
    if (!config || !config.badges || config.badges.length === 0) return;

    const data = {
      tag: (this.getAttribute('data-tags') || '').split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0),
      rating: parseFloat(this.getAttribute('data-rating')) || 0,
      inventory: parseInt(this.getAttribute('data-inventory')) || 0,
      price: parseFloat(this.getAttribute('data-price')) || 0,
      compareAtPrice: parseFloat(this.getAttribute('data-compare-at-price')) || 0,
      vendor: (this.getAttribute('data-vendor') || '').toLowerCase(),
      type: (this.getAttribute('data-type') || '').toLowerCase(),
      title: (this.getAttribute('data-title') || '').toLowerCase(),
      createdAt: this.getAttribute('data-created-at') || ''
    };

    let winningBadge = null;

    // Iterate through configured blocks in order (highest priority first)
    for (let i = 0; i < config.badges.length; i++) {
      const badgeConfig = config.badges[i];
      if (this.evaluateCondition(badgeConfig, data)) {
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

  evaluateCondition(badgeConfig, data) {
    const { dataSource, operator, compareValue } = badgeConfig;
    let actualValue = data[dataSource];
    let compValue = compareValue;

    if (dataSource === 'price_sale') {
      actualValue = data.compareAtPrice > data.price ? 'true' : 'false';
      compValue = 'true';
    } else if (dataSource === 'age') {
      if (!data.createdAt) return false;
      const createdDate = new Date(data.createdAt);
      actualValue = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      compValue = parseFloat(compValue);
    } else if (['rating', 'inventory'].includes(dataSource)) {
      compValue = parseFloat(compValue);
    }

    switch (operator) {
      case 'equals':
        if (dataSource === 'tag') return actualValue.includes(compValue);
        return actualValue == compValue;
      case 'not_equals':
        if (dataSource === 'tag') return !actualValue.includes(compValue);
        return actualValue != compValue;
      case 'greater_than':
        return actualValue > compValue;
      case 'less_than':
        return actualValue < compValue;
      case 'contains':
        if (Array.isArray(actualValue)) return actualValue.some(v => v.includes(compValue));
        if (typeof actualValue === 'string') return actualValue.includes(compValue);
        return false;
      default:
        return false;
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
