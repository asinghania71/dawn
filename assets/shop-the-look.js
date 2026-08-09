if (!customElements.get('shop-the-look')) {
  customElements.define('shop-the-look', class ShopTheLook extends HTMLElement {
    constructor() {
      super();
      this.hotspots = this.querySelectorAll('.shop-the-look__hotspot');
      
      this.hotspots.forEach(hotspot => {
        const button = hotspot.querySelector('.shop-the-look__hotspot-button');
        const closeButton = hotspot.querySelector('.shop-the-look__tooltip-close');
        
        button.addEventListener('click', (e) => this.toggleTooltip(e, hotspot));
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllTooltips();
          });
        }
      });

      // Close tooltip when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) {
          this.closeAllTooltips();
        }
      });
      
      // Close on escape key
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
          this.closeAllTooltips();
        }
      });
    }

    toggleTooltip(e, currentHotspot) {
      e.stopPropagation();
      const button = currentHotspot.querySelector('.shop-the-look__hotspot-button');
      const tooltip = currentHotspot.querySelector('.shop-the-look__tooltip');
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Close all first
      this.closeAllTooltips();

      if (!isExpanded) {
        button.setAttribute('aria-expanded', 'true');
        tooltip.setAttribute('aria-hidden', 'false');
        this.adjustTooltipPosition(currentHotspot, tooltip);
      }
    }

    closeAllTooltips() {
      this.hotspots.forEach(hotspot => {
        const button = hotspot.querySelector('.shop-the-look__hotspot-button');
        const tooltip = hotspot.querySelector('.shop-the-look__tooltip');
        if (button && tooltip) {
          button.setAttribute('aria-expanded', 'false');
          tooltip.setAttribute('aria-hidden', 'true');
        }
      });
    }

    adjustTooltipPosition(hotspot, tooltip) {
      // Reset any previous inline styles
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%) translateY(10px)';
      tooltip.querySelector('::before') ? tooltip.querySelector('::before').style.left = '50%' : null;

      const hotspotRect = hotspot.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = this.getBoundingClientRect();

      let newLeft = 50; // percentage
      
      // Check right edge
      if (hotspotRect.left + tooltipRect.width / 2 > containerRect.right) {
        // Tooltip goes off right screen, shift it left
        const overflow = (hotspotRect.left + tooltipRect.width / 2) - containerRect.right + 15;
        tooltip.style.left = `calc(50% - ${overflow}px)`;
      } 
      // Check left edge
      else if (hotspotRect.left - tooltipRect.width / 2 < containerRect.left) {
        // Tooltip goes off left screen, shift it right
        const overflow = containerRect.left - (hotspotRect.left - tooltipRect.width / 2) + 15;
        tooltip.style.left = `calc(50% + ${overflow}px)`;
      }
    }
  });
}
