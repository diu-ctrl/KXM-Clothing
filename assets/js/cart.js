// Shared Cart State Management for Kxm. Website
const KxmCart = {
  items: [],

  init() {
    this.load();
    this.setupDOM();
    this.render();
  },

  load() {
    const stored = localStorage.getItem('kxm_cart_items');
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch (e) {
        this.items = [];
      }
    }
  },

  save() {
    localStorage.setItem('kxm_cart_items', JSON.stringify(this.items));
    this.render();
  },

  addItem(product) {
    // product should be: { id, name, price, image, size, quantity }
    const existing = this.items.find(item => item.id === product.id && item.size === product.size);
    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      this.items.push(product);
    }
    this.save();
    this.openDrawer();
  },

  removeItem(id, size) {
    this.items = this.items.filter(item => !(item.id === id && item.size === size));
    this.save();
  },

  updateQuantity(id, size, quantity) {
    const item = this.items.find(item => item.id === id && item.size === size);
    if (item) {
      item.quantity = Math.max(1, parseInt(quantity) || 1);
      this.save();
    }
  },

  get totalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  },

  get subtotal() {
    return this.items.reduce((total, item) => {
      // Parse price string: e.g. "₹30,435" or "From ₹8,084"
      const cleanPrice = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
      return total + (cleanPrice * item.quantity);
    }, 0);
  },

  formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },

  openDrawer() {
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      const menuToggle = document.getElementById('menuToggle');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.add('cart-open');
  },

  closeDrawer() {
    document.body.classList.remove('cart-open');
  },

  openCheckoutModal() {
    this.closeDrawer();
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.add('show');
    }
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  setupDOM() {
    // Setup Drawer toggle buttons
    const openDrawerBtns = document.querySelectorAll('.js-cart-open');
    openDrawerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    const closeDrawerBtn = document.getElementById('cartCloseBtn');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
    }

    const cartBackdrop = document.getElementById('cartBackdrop');
    if (cartBackdrop) {
      cartBackdrop.addEventListener('click', () => this.closeDrawer());
    }

    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.openCheckoutModal());
    }

    const modalCloseBtn = document.getElementById('checkoutModalCloseBtn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeCheckoutModal());
    }

    const modalBackdrop = document.getElementById('checkoutModal');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeCheckoutModal();
        }
      });
    }

    // Escape key handler
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDrawer();
        this.closeCheckoutModal();
      }
    });
  },

  render() {
    const container = document.getElementById('cartItemsContainer');
    const subtotalValueEl = document.getElementById('cartSubtotalValue');
    
    // Update body class based on items presence
    if (this.items.length > 0) {
      document.body.classList.add('cart-has-items');
    } else {
      document.body.classList.remove('cart-has-items');
    }

    // Update Nav Badge (only if .nav-link-cart exists)
    const navCartLink = document.querySelector('.nav-link-cart');
    if (navCartLink) {
      let badge = document.getElementById('cartBadge');
      if (this.totalItems > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.id = 'cartBadge';
          badge.className = 'cart-badge';
          navCartLink.appendChild(badge);
        }
        badge.textContent = this.totalItems;
      } else if (badge) {
        badge.remove();
      }
    }

    if (container) {
      container.innerHTML = '';
      this.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="cart-item-details">
            <div class="cart-item-header-row">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">${item.price}</span>
            </div>
            ${item.size ? `<span class="cart-item-size">Size: ${item.size}</span>` : ''}
            <div class="cart-item-qty-row">
              <div class="cart-item-quantity-controls">
                <button class="qty-adjust-btn dec-qty-btn" aria-label="Decrease quantity">&minus;</button>
                <input type="number" class="qty-value-input" value="${item.quantity}" min="1" aria-label="Quantity" />
                <button class="qty-adjust-btn inc-qty-btn" aria-label="Increase quantity">+</button>
              </div>
              <a class="cart-item-remove-link" role="button">Remove Item</a>
            </div>
          </div>
        `;

        // Add Event Listeners for quantity controls and removal
        const decBtn = itemEl.querySelector('.dec-qty-btn');
        const incBtn = itemEl.querySelector('.inc-qty-btn');
        const qtyInput = itemEl.querySelector('.qty-value-input');
        const removeLink = itemEl.querySelector('.cart-item-remove-link');

        decBtn.addEventListener('click', () => {
          this.updateQuantity(item.id, item.size, item.quantity - 1);
        });
        incBtn.addEventListener('click', () => {
          this.updateQuantity(item.id, item.size, item.quantity + 1);
        });
        qtyInput.addEventListener('change', (e) => {
          this.updateQuantity(item.id, item.size, parseInt(e.target.value) || 1);
        });
        removeLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.removeItem(item.id, item.size);
        });

        container.appendChild(itemEl);
      });
    }

    if (subtotalValueEl) {
      subtotalValueEl.textContent = this.formatCurrency(this.subtotal);
    }
  }
};

// Expose globally
window.KxmCart = KxmCart;

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  KxmCart.init();
});
