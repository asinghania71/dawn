if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', class StickyAddToCart extends HTMLElement {
    constructor() {
      super();
      this.formId = this.dataset.formId;
      this.mainForm = document.getElementById(this.formId);
      this.mainSubmitButton = this.mainForm?.querySelector('button[type="submit"], button.product-form__submit');
      this.stickyButton = this.querySelector('.sticky-add-to-cart__button');
      this.stickyPrice = this.querySelector('.sticky-add-to-cart__price');
      this.mainPrice = document.getElementById(`price-${this.formId.replace('product-form-', '')}`);

      if (!this.mainForm || !this.mainSubmitButton || !this.stickyButton) return;

      this.setupObserver();
      this.setupEventListeners();
    }

    setupObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            this.classList.add('is-active');
          } else {
            this.classList.remove('is-active');
          }
        });
      }, options);

      this.observer.observe(this.mainSubmitButton);
    }

    setupEventListeners() {
      this.stickyButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.mainSubmitButton.getAttribute('aria-disabled') === 'true' || this.mainSubmitButton.disabled) {
          return;
        }
        
        this.stickyButton.setAttribute('aria-disabled', true);
        this.stickyButton.classList.add('loading');
        this.stickyButton.querySelector('.loading-overlay__spinner').classList.remove('hidden');

        this.mainSubmitButton.click();
        
        setTimeout(() => {
          this.stickyButton.removeAttribute('aria-disabled');
          this.stickyButton.classList.remove('loading');
          this.stickyButton.querySelector('.loading-overlay__spinner').classList.add('hidden');
        }, 1500);
      });

      this.setupMutationObservers();
    }

    setupMutationObservers() {
      const buttonObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && (mutation.attributeName === 'disabled' || mutation.attributeName === 'aria-disabled')) {
            const isDisabled = this.mainSubmitButton.disabled || this.mainSubmitButton.getAttribute('aria-disabled') === 'true';
            this.stickyButton.disabled = this.mainSubmitButton.disabled;
            if (isDisabled) {
              this.stickyButton.setAttribute('aria-disabled', 'true');
            } else {
              this.stickyButton.removeAttribute('aria-disabled');
            }
          }
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const mainText = Array.from(this.mainSubmitButton.childNodes)
                               .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('loading-overlay__spinner')))
                               .map(node => node.textContent)
                               .join('').trim();
            const stickySpan = this.stickyButton.querySelector('span');
            if (stickySpan && mainText) {
              stickySpan.textContent = mainText;
            }
          }
        });
      });

      buttonObserver.observe(this.mainSubmitButton, { attributes: true, childList: true, subtree: true });

      if (this.mainPrice && this.stickyPrice) {
        const priceObserver = new MutationObserver(() => {
          this.stickyPrice.innerHTML = this.mainPrice.innerHTML;
        });
        priceObserver.observe(this.mainPrice, { childList: true, subtree: true });
      }
    }
  });
}
