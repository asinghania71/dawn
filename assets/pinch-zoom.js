class PinchZoom extends HTMLElement {
  constructor() {
    super();
    this.image = this.querySelector('img');
    if (!this.image) return;

    this.initialDistance = null;
    this.currentScale = 1;

    this.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    this.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
  }

  getDistance(touches) {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  onTouchStart(e) {
    if (e.touches.length === 2) {
      this.initialDistance = this.getDistance(e.touches);
      // Disable slider scrolling while pinching
      const slider = this.closest('slider-component');
      if (slider) slider.style.overflowX = 'hidden';
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 2 && this.initialDistance) {
      e.preventDefault(); // Prevent page scroll
      const currentDistance = this.getDistance(e.touches);
      this.currentScale = currentDistance / this.initialDistance;
      
      // Limit zoom between 1x and 3x
      this.currentScale = Math.min(Math.max(1, this.currentScale), 3);
      
      this.image.style.transform = `scale(${this.currentScale})`;
      this.image.style.transition = 'none';
      this.image.style.zIndex = '10';
      this.style.zIndex = '10';
    }
  }

  onTouchEnd(e) {
    if (e.touches.length < 2) {
      this.initialDistance = null;
      this.currentScale = 1;
      
      // Reset image smoothly
      this.image.style.transform = 'scale(1)';
      this.image.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        this.image.style.zIndex = 'auto';
        this.style.zIndex = 'auto';
      }, 300);

      const slider = this.closest('slider-component');
      if (slider) slider.style.overflowX = 'auto';
    }
  }
}

customElements.define('pinch-zoom', PinchZoom);
