class FrequentlyBoughtTogether extends HTMLElement {
  constructor() {
    super();
    this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    this.setup();
  }

  setup() {
    const url = this.dataset.url;
    if (!url) return;

    fetch(url)
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector(`frequently-bought-together`);
        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
          this.initBundle();
        }
      })
      .catch(e => {
        console.error(e);
      });
  }

  initBundle() {
    this.checkboxes = this.querySelectorAll('.fbt-bundle__checkbox');
    this.totalPriceEl = this.querySelector('.fbt-bundle__total-price');
    this.addButton = this.querySelector('.fbt-bundle__add-button');
    this.errorMessage = this.querySelector('.fbt-bundle__error-message');
    
    // Main product price
    this.mainPriceEl = this.querySelector('.fbt-bundle__item--main .fbt-bundle__price');
    
    this.checkboxes.forEach(cb => {
      cb.addEventListener('change', this.updateTotal.bind(this));
    });

    this.addButton.addEventListener('click', this.addToCart.bind(this));
    this.updateTotal();
  }

  updateTotal() {
    let total = parseInt(this.mainPriceEl.dataset.price, 10);
    this.checkboxes.forEach(cb => {
      if (cb.checked) {
        const priceEl = cb.closest('.fbt-bundle__item').querySelector('.fbt-bundle__price');
        total += parseInt(priceEl.dataset.price, 10);
      }
    });

    // Simple money formatting (fallback)
    const formatted = (total / 100).toFixed(2);
    this.totalPriceEl.textContent = Shopify.currency ? `${Shopify.currency.active}${formatted}` : `$${formatted}`;
  }

  addToCart() {
    this.errorMessage.classList.add('hidden');
    this.addButton.setAttribute('aria-disabled', true);
    this.addButton.classList.add('loading');
    
    const items = [{
      id: parseInt(this.dataset.mainVariant, 10),
      quantity: 1
    }];

    this.checkboxes.forEach(cb => {
      if (cb.checked) {
        items.push({
          id: parseInt(cb.dataset.variantId, 10),
          quantity: 1
        });
      }
    });

    const config = fetchConfig('javascript');
    config.headers['Content-Type'] = 'application/json';

    const body = { items };
    if (this.cart) {
      body.sections = this.cart.getSectionsToRender().map((s) => s.id);
      body.sections_url = window.location.pathname;
    }
    
    config.body = JSON.stringify(body);

    fetch(routes.cart_add_url, config)
      .then(response => response.json())
      .then(response => {
        if (response.status) {
          this.errorMessage.textContent = response.description || response.message;
          this.errorMessage.classList.remove('hidden');
          return;
        }

        if (!this.cart) {
          window.location = routes.cart_url;
          return;
        }

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'fbt-bundle',
          cartData: response,
        });

        this.cart.renderContents(response);
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        this.addButton.removeAttribute('aria-disabled');
        this.addButton.classList.remove('loading');
      });
  }
}

customElements.define('frequently-bought-together', FrequentlyBoughtTogether);
