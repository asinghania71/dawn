/**
 * Announcement Bar Premium Components
 * - AnnouncementBarManager: dismiss + marquee speed calibration
 * - CountdownTimer: live countdown
 * - CartGoalTracker: dynamic cart-based goal messaging
 */

/* ============================================================
   Announcement Bar Manager
   ============================================================ */
class AnnouncementBarManager extends HTMLElement {
  connectedCallback() {
    // Dismiss logic
    if (sessionStorage.getItem('announcement-dismissed') === 'true') {
      this.hidden = true;
      return;
    }

    this.closeButton = this.querySelector('.announcement-bar__close');
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.hidden = true;
        sessionStorage.setItem('announcement-dismissed', 'true');
      });
    }

    // Marquee: calibrate animation duration based on real content width
    this.calibrateMarquee();
  }

  calibrateMarquee() {
    const marquee = this.querySelector('.announcement-bar-marquee');
    if (!marquee) return;

    const firstContent = marquee.querySelector('.announcement-bar-marquee__content');
    if (!firstContent) return;

    // Wait one frame so the browser has laid out the content
    requestAnimationFrame(() => {
      const contentWidth = firstContent.offsetWidth;
      // Base speed: the user-configured --marquee-speed is pixels per second
      // We want the full content strip to traverse in a comfortable time.
      // Use the user setting as a base multiplier (lower = faster).
      const userSpeed = parseFloat(getComputedStyle(marquee).getPropertyValue('--marquee-speed')) || 15;
      // Calculate duration so it feels consistent regardless of content length
      // ~60px/s at speed=15 → duration = contentWidth / (60 * 15/userSpeed)
      const pxPerSecond = 60 * (15 / userSpeed);
      const duration = contentWidth / pxPerSecond;
      marquee.style.setProperty('--marquee-duration', `${duration}s`);
    });
  }
}

if (!customElements.get('announcement-bar-manager')) {
  customElements.define('announcement-bar-manager', AnnouncementBarManager);
}

/* ============================================================
   Countdown Timer
   ============================================================ */
class CountdownTimer extends HTMLElement {
  connectedCallback() {
    this.displayElement = this.querySelector('.countdown-timer__display');
    this.endDateStr = this.dataset.endDate;
    this.endTimeStr = this.dataset.endTime;
    this.interval = null;

    if (this.displayElement && this.endDateStr && this.endTimeStr) {
      this.targetDate = new Date(`${this.endDateStr}T${this.endTimeStr}:00`);
      this.update();
      this.interval = setInterval(this.update.bind(this), 1000);
    }
  }

  update() {
    const now = new Date();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      clearInterval(this.interval);
      this.displayElement.textContent = '00:00:00:00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    this.displayElement.textContent =
      `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  disconnectedCallback() {
    if (this.interval) clearInterval(this.interval);
  }
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}

/* ============================================================
   Cart Goal Tracker
   ============================================================ */
class CartGoalTracker extends HTMLElement {
  connectedCallback() {
    this.textElement = this.querySelector('.cart-goal-tracker__text');
    this.threshold = parseInt(this.dataset.threshold, 10);
    this.progressText = this.dataset.progressText;
    this.successText = this.dataset.successText;

    this.updateGoal();

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      this.unsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.updateGoal.bind(this));
    }
  }

  formatMoney(cents) {
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents, window.theme && window.theme.moneyFormat);
    }
    return '$' + (cents / 100).toFixed(2);
  }

  updateGoal() {
    fetch(window.Shopify.routes.root + 'cart.js')
      .then((r) => r.json())
      .then((cart) => {
        if (!this.textElement) return;

        const total = cart.total_price;
        if (total >= this.threshold) {
          this.textElement.innerHTML =
            '<span class="svg-wrapper" style="margin-right:0.5rem;vertical-align:middle;">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            '</span>' +
            this.successText;
          if (this.dataset.successColor) {
            this.style.color = this.dataset.successColor;
          }
        } else {
          const remaining = this.threshold - total;
          this.textElement.innerHTML = this.progressText.replace('[amount]', this.formatMoney(remaining));
          if (this.dataset.textColor) {
            this.style.color = this.dataset.textColor;
          }
        }
      });
  }

  disconnectedCallback() {
    if (this.unsubscriber) this.unsubscriber();
  }
}

if (!customElements.get('cart-goal-tracker')) {
  customElements.define('cart-goal-tracker', CartGoalTracker);
}
