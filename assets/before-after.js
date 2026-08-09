if (!customElements.get('before-after-slider')) {
  customElements.define('before-after-slider', class BeforeAfterSlider extends HTMLElement {
    constructor() {
      super();
      this.wrapper = this.querySelector('.before-after__image-wrapper');
      this.handle = this.querySelector('.before-after__handle-button');
      this.isDragging = false;
      
      this.bindEvents();
    }

    bindEvents() {
      // Touch and mouse events
      this.wrapper.addEventListener('mousedown', this.startDrag.bind(this));
      this.wrapper.addEventListener('touchstart', this.startDrag.bind(this), { passive: true });
      
      window.addEventListener('mousemove', this.drag.bind(this));
      window.addEventListener('touchmove', this.drag.bind(this), { passive: false });
      
      window.addEventListener('mouseup', this.stopDrag.bind(this));
      window.addEventListener('touchend', this.stopDrag.bind(this));
    }

    startDrag(e) {
      this.isDragging = true;
      this.updatePosition(e);
    }

    stopDrag() {
      this.isDragging = false;
    }

    drag(e) {
      if (!this.isDragging) return;
      
      // Prevent scrolling while dragging on touch devices
      if (e.type === 'touchmove') {
        e.preventDefault();
      }
      
      this.updatePosition(e);
    }

    updatePosition(e) {
      const rect = this.wrapper.getBoundingClientRect();
      
      // Get x position from mouse or touch
      const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      
      // Calculate percentage
      let x = clientX - rect.left;
      let percent = (x / rect.width) * 100;
      
      // Clamp between 0 and 100
      percent = Math.max(0, Math.min(100, percent));
      
      // Update CSS variable
      this.style.setProperty('--percent', `${percent}%`);
      
      // Update hidden range input for accessibility (optional, if you had one)
      const input = this.querySelector('.before-after__range');
      if (input) {
        input.value = percent;
      }
    }
  });
}
