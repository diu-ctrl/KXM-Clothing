/* ============================================================
   KXM — cart.js (Round 2 rebuild)
   Drives the existing .cart-drawer markup on every page.
   Public API: window.KxmCart
     .addItem({id,name,price,image,size,quantity})
     .setQty(key, qty) / .removeItem(key) / .clear()
     .open() / .close() / .items()
   ============================================================ */
(function () {
  'use strict';

  /* Storage key — kept from the previous cart implementation */
  var STORAGE_KEY = 'kxm_cart_items';

  /* ── State ─────────────────────────────────────────── */
  var items = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('kxm_cart');
      return JSON.parse(raw) || [];
    }
    catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch (e) { /* storage unavailable — ignore */ }
  }

  /* ── Helpers ───────────────────────────────────────── */
  function parsePrice(str) {
    var n = parseFloat(String(str).replace(/[^0-9.]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }
  function money(n) {
    try { return '₹' + n.toLocaleString('en-IN'); }
    catch (e) { return '₹' + n; }
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lineKey(it) { return it.id + '::' + (it.size || 'OS'); }
  function findItem(key) {
    for (var i = 0; i < items.length; i++) {
      if (lineKey(items[i]) === key) return items[i];
    }
    return null;
  }
  function count() {
    return items.reduce(function (s, it) { return s + (it.quantity || 1); }, 0);
  }
  function subtotal() {
    return items.reduce(function (s, it) {
      return s + parsePrice(it.price) * (it.quantity || 1);
    }, 0);
  }

  /* ── DOM bootstrap ─────────────────────────────────── */
  var DRAWER_HTML =
    '<div id="cartDrawer" class="cart-drawer">' +
      '<div class="cart-header"><span class="cart-header-title">My Cart</span>' +
      '<button class="cart-close-btn" id="cartCloseBtn">Close</button></div>' +
      '<div class="cart-items-container" id="cartItemsContainer"></div>' +
      '<div class="cart-footer" id="cartFooter">' +
        '<div class="cart-footer-row"><span class="cart-footer-label">Subtotal</span>' +
        '<span class="cart-footer-value" id="cartSubtotalValue">₹0</span></div>' +
        '<div class="cart-footer-row"><span class="cart-footer-label">Shipping</span>' +
        '<span class="cart-footer-value shipping-calculated">Calculated at checkout</span></div>' +
        '<div class="cart-footer-divider"></div>' +
        '<button class="cart-checkout-btn" id="cartCheckoutBtn">Checkout</button></div>' +
      '<div class="cart-empty-state" id="cartEmptyState">' +
        '<h3 class="cart-empty-title">Your Cart is Empty</h3>' +
        '<p class="cart-empty-subtitle">Come on, treat yourself. You deserve it.</p>' +
        '<a href="shop.html" class="cart-shop-now-btn" id="cartShopNowBtn">[ Shop Now ]</a></div>' +
    '</div>' +
    '<div id="cartBackdrop" class="cart-backdrop"></div>';

  var MODAL_HTML =
    '<div id="checkoutModal" class="checkout-modal-overlay">' +
      '<div class="checkout-modal">' +
        '<button class="checkout-modal-close-btn" id="checkoutModalCloseBtn" aria-label="Close modal">&times;</button>' +
        '<h3 class="checkout-modal-heading">Thank You for Exploring</h3>' +
        '<p class="checkout-modal-text">This is a demonstration website created for portfolio purposes. Kxm. is an imaginary brand, and purchases cannot be completed.</p>' +
        '<p class="checkout-modal-text">If you\'re interested in a website like this for your brand, let\'s talk.</p>' +
        '<a href="mailto:divyarajc2@gmail.com" class="checkout-modal-cta-btn">Get in Touch</a>' +
      '</div></div>';

  function ensureCartCss() {
    if (document.querySelector('link[href*="cart.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'assets/css/cart.css';
    document.head.appendChild(l);
  }
  function ensureDom() {
    ensureCartCss();
    if (!document.getElementById('cartDrawer')) {
      document.body.insertAdjacentHTML('beforeend', DRAWER_HTML);
    }
    if (!document.getElementById('checkoutModal')) {
      document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    }
  }

  /* ── Rendering ─────────────────────────────────────── */
  function render() {
    var wrap   = document.getElementById('cartItemsContainer');
    var footer = document.getElementById('cartFooter');
    var empty  = document.getElementById('cartEmptyState');
    var title  = document.querySelector('#cartDrawer .cart-header-title');
    var subEl  = document.getElementById('cartSubtotalValue');
    if (!wrap) return;

    var n = count();
    if (title) title.textContent = n ? 'My Cart (' + n + ')' : 'My Cart';

    if (!items.length) {
      wrap.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (empty) empty.style.display = 'flex';
    } else {
      if (empty) empty.style.display = 'none';
      wrap.style.display = 'block';
      if (footer) footer.style.display = 'block';
      var html = '';
      items.forEach(function (it) {
        var k = lineKey(it);
        var meta = it.size ? 'Size ' + esc(it.size) + ' · ' + it.price : esc(it.price);
        html +=
          '<div class="cart-item" data-key="' + esc(k) + '">' +
            '<div class="cart-item-img"><img src="' + esc(it.image) + '" alt="' + esc(it.name) + '" /></div>' +
            '<div class="cart-item-details">' +
              '<span class="cart-item-name">' + esc(it.name) + '</span>' +
              '<span class="cart-item-meta">' + meta + '</span>' +
              '<div class="cart-item-qty">' +
                '<button type="button" data-action="dec" aria-label="Decrease quantity"' +
                  ((it.quantity || 1) <= 1 ? ' disabled' : '') + '>&minus;</button>' +
                '<span class="cart-item-qty-value">' + (it.quantity || 1) + '</span>' +
                '<button type="button" data-action="inc" aria-label="Increase quantity">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="cart-item-side">' +
              '<span class="cart-item-line">' + money(parsePrice(it.price) * (it.quantity || 1)) + '</span>' +
              '<button type="button" class="cart-item-remove" data-action="remove">Remove</button>' +
            '</div>' +
          '</div>';
      });
      wrap.innerHTML = html;
    }
    if (subEl) subEl.textContent = money(subtotal());
  }

  /* ── Open / close ──────────────────────────────────── */
  function openCart() {
    document.body.classList.remove('menu-open'); /* never stack overlays */
    document.body.classList.add('cart-open');
    var c = document.getElementById('cartCloseBtn');
    if (c) c.focus();
  }
  function closeCart() { document.body.classList.remove('cart-open'); }

  /* ── Public API ────────────────────────────────────── */
  function addItem(item) {
    if (!item || !item.id) return;
    var k = item.id + '::' + (item.size || 'OS');
    var ex = findItem(k);
    if (ex) {
      ex.quantity = (ex.quantity || 1) + (item.quantity || 1);
    } else {
      items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size || null,
        quantity: item.quantity || 1
      });
    }
    save(); render(); openCart();
  }
  function setQty(key, qty) {
    var it = findItem(key);
    if (!it) return;
    it.quantity = Math.max(1, qty);
    save(); render();
  }
  function removeItem(key) {
    items = items.filter(function (it) { return lineKey(it) !== key; });
    save(); render();
  }
  function clear() { items = []; save(); render(); }

  window.KxmCart = {
    addItem: addItem,
    setQty: setQty,
    removeItem: removeItem,
    clear: clear,
    open: openCart,
    close: closeCart,
    items: function () { return items.slice(); }
  };

  /* ── Events (delegated — works on every page) ──────── */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var opener = t.closest('.js-cart-open');
    if (opener) { e.preventDefault(); openCart(); return; }

    var btn = t.closest('[data-action]');
    if (btn && btn.closest('.cart-items-container')) {
      var row = btn.closest('.cart-item');
      var key = row ? row.getAttribute('data-key') : null;
      var it = key ? findItem(key) : null;
      if (!it) return;
      var action = btn.getAttribute('data-action');
      if (action === 'inc') setQty(key, (it.quantity || 1) + 1);
      if (action === 'dec' && (it.quantity || 1) > 1) setQty(key, it.quantity - 1);
      if (action === 'remove') removeItem(key);
      return;
    }

    if (t.closest('#cartCloseBtn') || t.id === 'cartBackdrop') { closeCart(); return; }

    if (t.closest('#cartCheckoutBtn')) {
      if (!items.length) return;
      closeCart();
      var m = document.getElementById('checkoutModal');
      if (m) m.classList.add('is-open');
      return;
    }
    if (t.closest('#checkoutModalCloseBtn')) {
      var mm = document.getElementById('checkoutModal');
      if (mm) mm.classList.remove('is-open');
      return;
    }
    if (t.id === 'checkoutModal') { t.classList.remove('is-open'); return; }

    if (t.closest('#cartShopNowBtn')) closeCart(); /* let the link navigate */
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('cart-open')) { closeCart(); return; }
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
    }
  });

  /* ── Graceful image fallback ─────────────────────────
     If an alternate product image is missing on disk, remove
     it so the primary image always shows through (no white
     cards, no broken thumbnails). */
  function cleanupBrokenImgs() {
    var imgs = document.querySelectorAll('img.hover-img, .thumbnail-card img');
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete && img.naturalWidth === 0) { img.remove(); return; }
      img.addEventListener('error', function () { img.remove(); });
    });
  }

  /* ── Boot ──────────────────────────────────────────── */
  function boot() { ensureDom(); render(); cleanupBrokenImgs(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
