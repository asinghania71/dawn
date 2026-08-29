class EstimatedDelivery extends HTMLElement {
  constructor() {
    super();
    this.textElement = this.querySelector('.estimated-delivery__text');
    this.minDays = parseInt(this.dataset.minDays || 3, 10);
    this.maxDays = parseInt(this.dataset.maxDays || 5, 10);
    this.cutoffHour = parseInt(this.dataset.cutoff || 14, 10);
    
    this.calculateDelivery();
  }

  calculateDelivery() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If past cutoff hour, add an extra day
    let startDays = this.minDays;
    let endDays = this.maxDays;
    let hoursRemaining = this.cutoffHour - currentHour;
    
    if (hoursRemaining <= 0) {
      startDays += 1;
      endDays += 1;
    }

    const startDate = this.addBusinessDays(now, startDays);
    const endDate = this.addBusinessDays(now, endDays);

    const options = { month: 'short', day: 'numeric' };
    const startString = startDate.toLocaleDateString(undefined, options);
    const endString = endDate.toLocaleDateString(undefined, options);

    let message = `Get it between <strong>${startString} - ${endString}</strong>`;
    
    if (hoursRemaining > 0 && hoursRemaining <= 12) {
      message = `Order within ${hoursRemaining} hrs to get it between <strong>${startString} - ${endString}</strong>`;
    }

    if (this.textElement) {
      this.textElement.innerHTML = message;
    }
  }

  addBusinessDays(date, daysToAdd) {
    const result = new Date(date);
    let count = 0;
    while (count < daysToAdd) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        count++;
      }
    }
    return result;
  }
}

customElements.define('estimated-delivery', EstimatedDelivery);
