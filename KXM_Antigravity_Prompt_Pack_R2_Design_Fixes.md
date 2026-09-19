# KXM — Round 2 Fix Pack
## Cart Rebuild · Extended Menu Repair · Hover-Image Fix · Site-Wide Polish
### Ready-to-feed Antigravity prompt pack (9 surgical prompts)

> **How to use this pack**
> - Feed prompts to Antigravity **one at a time, in order** (1 → 9). Each prompt is self-contained.
> - Every prompt ends with a **commit, never push** — you push via GitHub Desktop as always.
> - All verification commands are **PowerShell 5.1 compatible** (`Select-String`, `Get-ChildItem`, `Rename-Item` — no pwsh-only flags).
> - Prompts 1 and 2 contain **complete replacement files** — Antigravity does not need to invent anything; it copies, saves, verifies.
> - Run the site locally (Live Server or `file://`) and do the visual checks listed in each prompt before committing.

---

# PART A — DIAGNOSIS (verified against your actual code)

I read `index.html` (2,037 lines), `shop.html` (808), `product.html` (1,546) line-by-line, plus your screenshots. Here is what is *actually* happening — all three reported bugs are understood at root-cause level.

## A1. The cart at the end of the page — you have TWO cart systems fighting

Your screenshots show an **unstyled, full-width cart panel rendered below the footer** ("My Cart [Close] … SUBTOTAL … CHECKOUT" stretched edge-to-edge). Root cause:

- Each page contains a **designed cart drawer** in the markup (`<div id="cartDrawer" class="cart-drawer">` — 420px right-side slide-in, with backdrop, styled in each page's `<style>` block). This drawer is **hidden and unused** — nothing ever triggers `body.cart-open`.
- Meanwhile the old `assets/js/cart.js` **injects its own legacy cart panel** at the end of `<body>` on every page. Its copy proves it: the injected panel says *"Your Cart Is Empty — Complete your first purchase experience [Browse Items]"*, while the designed drawer says *"Your Cart is Empty — Come on, treat yourself. You deserve it. [ Shop Now ]"*. What you see at the bottom of every page is the **legacy injected panel**, not the drawer.
- Additionally, the drawer CSS is **incomplete everywhere**: `.cart-items-container`, `.cart-item-*`, `.cart-footer`, `.cart-footer-*`, `.cart-checkout-btn`, `.cart-empty-state` have **zero CSS on any page** (verified by grep). And the demo **checkout modal** (`#checkoutModal`) has **zero CSS on all three pages** — it is a second unstyled artifact waiting at the end of the page.
- product.html already calls the integration point: `window.KxmCart.addItem({ id, name, price, image, size, quantity })` — so the new cart.js must expose exactly that API.

**Fix (Prompts 1 + 2):** delete the legacy injection by replacing `cart.js` with a proper implementation that drives the *existing* drawer markup, and complete the styling in `assets/css/cart.css` (it is already linked on all pages — the right single home for all cart UI styles). The inline panel at the page end disappears; clicking **Cart** anywhere (nav, menu, footer) now opens a polished 420px drawer.

## A2. The extended menu — "Shop Now / Join The Fam outside the white background"

The fullscreen dropdown (`#menuOverlay`) is broken by two numbers in the CSS, identical on `index.html` and `product.html`:

1. **`height: 55vh; min-height: 480px;`** — the white panel is only ~55% of the viewport tall, but its content (4 giant links + bottom row) needs more. On shorter viewports the overflow spills out: **"MY CART" and "JOIN THE FAM" render *below* the white panel, on the grey backdrop** — exactly what your screenshot shows.
2. **`.menu-link { color: rgba(2,2,2,0.22) }`** — the giant menu links are 22%-opacity black. That was meant as a "ghost" style that darkens on hover, but at rest it reads as broken placeholder grey — unreadable, as you said.

**Fix (Prompt 3):** make the overlay a true fullscreen menu (`100dvh`), links at 82% black (hover → full black), plus a staggered entrance animation and a scroll lock. Small, surgical CSS edits — same values in both files.

## A3. "Current Collection" hover — the CSS is fine; the hover **image files** are the problem

The hover mechanism in `index.html` is correctly built (`img.default-img` + `img.hover-img`, crossfade on `.product-card:hover`). The failure is in the file references — 5 of your 6 cards point at hover images whose names **do not match real files**:

| Card | Default image (loads ✓) | Hover image (suspicious) |
|---|---|---|
| Obsidian Blazer | `product-1.png` | `product-1a.png` |
| Ivory Wide-Leg | `product-2.png` | **`product- 2a.png`** (space) |
| Dusk Overcoat | `product-3.png` | **`product- 3a.png`** (space) |
| Silence Dress | `collection-women.png` | **`collection-women a.png`** (space) |
| Archive Set | `collection-accessories.png` | **`collection-accessories a.png`** (space) |
| White Edition | **`lookbook- 1.png`** (space — this is a *default* image!) | `lookbook-1aa.png` |

Key evidence: your **shop page images with spaces load fine** (`Noir Trench.png`, `Canvas Tote.png` render on the live site) — so spaces per se are not fatal. That means these hover files are either **absent** from `assets/images/` or **named differently on disk**. And the current CSS makes failure ugly: on hover the default image fades to `opacity: 0`, so a missing hover file = **a white card** (exactly the "Canvas Tote" white card in your screenshot, where the info panel slid up over nothing). `product.html`'s `productsData` contains the same bad names, so PDP galleries are affected too.

**Fix (Prompt 4):** inventory the real files → rename everything to space-free kebab-case (also fixes the old `Skill Bandana` / `Woll Scarf` typos) → update every reference in every HTML file → and make the CSS **failure-proof**: the default image never disappears; the hover image simply fades in *on top*. A missing hover file can then never blank a card again.

## A4. Bonus findings handled in this pack (they hurt the "overall design" you asked me to lift)

- `--font-primary` is still **`Arial, sans-serif`** on every page — the PP Neue Montreal OTFs were never deployed (404), so the whole site renders in system Arial. Prompt 5 swaps in **Instrument Sans** (free, Google-hosted, visually closest to Neue Montreal; pairs with your existing Instrument Serif). One-variable change, instant typography upgrade site-wide.
- Homepage marquee cards are **not clickable** (dead `<article>`s) — Prompt 6 wires each card to its `product.html?id=…` page.
- Three homepage story links have **no `href`** (`[Read our story]`, `[Our sourcing]`) — Prompt 6.
- No `Cart (n)` count, marquee runs hard against viewport edges, no focus/selection polish — Prompts 6–8.
- Nav cart count, `::selection`, `:focus-visible`, `prefers-reduced-motion` — included in the new `cart.css` (global) and prompts.

---

# PART B — DESIGN DIRECTION (protect this, so every future change stays coherent)

The site's identity is the Odd Ritual-inspired system you already built. Every prompt below obeys it:

- **Monochrome discipline:** `#020202` / `#ffffff` / `#f4f4f4`; hairlines at `rgba(2,2,2,0.06–0.12)`. No new hues.
- **Micro-labels:** uppercase, 0.55–0.75rem, letterspaced 0.08–0.14em — the "voice" of the UI.
- **Serif moments:** Instrument Serif for display/italic accents only (drawer empty state, modal heading, lifestyle script).
- **Motion:** slow, eased, single-axis — `cubic-bezier(0.16, 1, 0.3, 1)`; zooms ≤ 1.04; no bounce, no spin.
- **Restraint:** whitespace does the work. If a change needs a new color, a border radius, or a shadow heavier than a whisper — it's wrong.

---

# PART C — THE PROMPTS

---

## 🔧 PROMPT 1 — Complete the cart UI stylesheet (full file replacement)

```
## Goal
Replace assets/css/cart.css with the complete cart UI stylesheet below, so the
existing cart drawer, its items, footer, empty state, and the checkout modal
are fully styled on every page of the site.

## Strict Scope
- ONLY touch: assets/css/cart.css
- DO NOT edit any .html file in this prompt.
- DO NOT touch assets/js/cart.js (that is the next prompt).
- DO NOT run git push. Commit only.

## Steps
1. Open assets/css/cart.css, select ALL existing content, delete it, and save
   the following content EXACTLY as-is (UTF-8, keep the ₹ and − characters):

/* ============================================================
   KXM — cart.css (Round 2 — complete cart UI layer)
   Owns: cart drawer internals, checkout modal, scroll locks,
   focus & selection polish. Tokens come from each page with
   safe fallbacks so injected drawers look right everywhere.
   ============================================================ */

:root {
  --ck-black: var(--black, #020202);
  --ck-white: var(--white, #ffffff);
  --ck-grey:  var(--light-grey, #f4f4f4);
  --ck-faded: var(--light-faded, #818181);
  --ck-line:  rgba(2, 2, 2, 0.06);
  --ck-font:  var(--font-primary, Arial, sans-serif);
  --ck-serif: var(--font-display, 'Instrument Serif', Georgia, serif);
}

/* ── Global micro-polish ─────────────────────────────── */
::selection { background: var(--ck-black); color: var(--ck-white); }
a:focus-visible, button:focus-visible, input:focus-visible {
  outline: 1px solid var(--ck-black);
  outline-offset: 3px;
}
body.cart-open, body.menu-open { overflow: hidden; }

/* ── Drawer shell (fallback for pages without inline styles) ── */
.cart-drawer {
  position: fixed;
  top: 0; right: 0;
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: var(--ck-white);
  z-index: 300;
  transform: translateX(100%);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border-left: 1px solid var(--ck-line);
}
body.cart-open .cart-drawer { transform: translateX(0); }

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid var(--ck-line);
  flex-shrink: 0;
}
.cart-header-title {
  font-family: var(--ck-font);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ck-black);
}
.cart-close-btn {
  font-family: var(--ck-font);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ck-black);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  transition: opacity 0.2s ease;
}
.cart-close-btn:hover { opacity: 0.5; }

.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 2, 2, 0.25);
  -webkit-backdrop-filter: blur(1px);
  backdrop-filter: blur(1px);
  z-index: 290;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
body.cart-open .cart-backdrop { opacity: 1; pointer-events: auto; }

/* ── Items scroll area ───────────────────────────────── */
.cart-items-container {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.25rem 0 1rem;
}
.cart-items-container::-webkit-scrollbar { width: 3px; }
.cart-items-container::-webkit-scrollbar-track { background: transparent; }
.cart-items-container::-webkit-scrollbar-thumb { background: rgba(2, 2, 2, 0.2); }

/* ── Cart item row ───────────────────────────────────── */
.cart-item {
  display: grid;
  grid-template-columns: 84px 1fr auto;
  gap: 1.1rem;
  align-items: start;
  padding: 1.3rem 0;
  border-bottom: 1px solid var(--ck-line);
  animation: ckItemIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ckItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
.cart-item-img {
  width: 84px;
  height: 105px;
  background: var(--ck-grey);
  overflow: hidden;
}
.cart-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

.cart-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.1rem;
}
.cart-item-name {
  font-family: var(--ck-font);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ck-black);
  line-height: 1.4;
}
.cart-item-meta {
  font-family: var(--ck-font);
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ck-faded);
}
.cart-item-qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(2, 2, 2, 0.14);
  margin-top: 0.15rem;
  width: max-content;
}
.cart-item-qty button {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-family: var(--ck-font);
  color: var(--ck-black);
  transition: background 0.2s ease;
}
.cart-item-qty button:hover:not(:disabled) { background: var(--ck-grey); }
.cart-item-qty button:disabled { opacity: 0.3; cursor: default; }
.cart-item-qty-value {
  min-width: 2ch;
  text-align: center;
  font-family: var(--ck-font);
  font-size: 0.62rem;
  font-weight: 500;
}
.cart-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.1rem;
}
.cart-item-line {
  font-family: var(--ck-font);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ck-black);
}
.cart-item-remove {
  font-family: var(--ck-font);
  font-size: 0.55rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ck-faded);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}
.cart-item-remove:hover { color: var(--ck-black); }

/* ── Drawer footer / totals / checkout ───────────────── */
.cart-footer {
  border-top: 1px solid rgba(2, 2, 2, 0.12);
  padding-top: 1.4rem;
  margin-top: 0.5rem;
  flex-shrink: 0;
}
.cart-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.45rem 0;
}
.cart-footer-label {
  font-family: var(--ck-font);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ck-black);
}
.cart-footer-value {
  font-family: var(--ck-font);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ck-black);
}
.cart-footer-value.shipping-calculated {
  font-weight: 400;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ck-faded);
}
.cart-footer-divider {
  height: 1px;
  background: var(--ck-line);
  margin: 0.9rem 0 1.2rem;
}
.cart-checkout-btn {
  width: 100%;
  background: var(--ck-black);
  color: var(--ck-white);
  font-family: var(--ck-font);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 1.15rem 1rem;
  box-shadow: inset 0 0 0 1px var(--ck-black);
  transition: background 0.25s ease, color 0.25s ease;
}
.cart-checkout-btn:hover { background: var(--ck-white); color: var(--ck-black); }

/* ── Empty state container (visibility is JS-driven) ─── */
.cart-empty-state {
  display: none;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.cart-empty-title {
  font-family: var(--ck-serif);
  font-size: 1.7rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  margin-bottom: 0.8rem;
  color: var(--ck-black);
}
.cart-empty-subtitle {
  font-family: var(--ck-font);
  font-size: 0.66rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.6;
  color: var(--ck-faded);
  margin-bottom: 2.4rem;
  max-width: 18rem;
}
.cart-shop-now-btn {
  font-family: var(--ck-font);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ck-black);
  border-bottom: 1px solid var(--ck-black);
  padding-bottom: 2px;
  transition: opacity 0.2s ease;
}
.cart-shop-now-btn:hover { opacity: 0.5; }

/* ── Checkout demo modal (was completely unstyled) ───── */
.checkout-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(2, 2, 2, 0.45);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}
.checkout-modal-overlay.is-open { display: flex; }
.checkout-modal {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--ck-white);
  padding: 3.2rem 2.6rem 2.8rem;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.18);
  animation: ckModalIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ckModalIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
.checkout-modal-close-btn {
  position: absolute;
  top: 0.8rem;
  right: 1rem;
  font-size: 1.5rem;
  font-weight: 300;
  line-height: 1;
  color: var(--ck-black);
  transition: opacity 0.2s ease;
}
.checkout-modal-close-btn:hover { opacity: 0.4; }
.checkout-modal-heading {
  font-family: var(--ck-serif);
  font-size: 1.65rem;
  font-weight: 400;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
  color: var(--ck-black);
}
.checkout-modal-text {
  font-family: var(--ck-font);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.9;
  color: var(--ck-faded);
  margin-bottom: 0.8rem;
}
.checkout-modal-cta-btn {
  display: inline-block;
  margin-top: 1rem;
  font-family: var(--ck-font);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ck-black);
  border: 1px solid var(--ck-black);
  padding: 0.9rem 2.4rem;
  transition: background 0.25s ease, color 0.25s ease;
}
.checkout-modal-cta-btn:hover { background: var(--ck-black); color: var(--ck-white); }

/* ── Mobile ──────────────────────────────────────────── */
@media (max-width: 600px) {
  .cart-drawer { max-width: 100%; padding: 1rem; }
  .cart-item { grid-template-columns: 72px 1fr auto; gap: 0.85rem; }
  .cart-item-img { width: 72px; height: 90px; }
  .checkout-modal { padding: 2.6rem 1.6rem 2.2rem; }
}

/* ── Accessibility: reduced motion ───────────────────── */
@media (prefers-reduced-motion: reduce) {
  .cart-drawer, .cart-backdrop, .checkout-modal, .cart-item {
    animation: none;
    transition: none;
  }
}

2. Save the file (UTF-8).

## Verify (PowerShell 5.1)
Select-String -Path "assets\css\cart.css" -Pattern "cart-checkout-btn" | Measure-Object | ForEach-Object { $_.Count }
# Expected: at least 2
Select-String -Path "assets\css\cart.css" -Pattern "checkout-modal-overlay" | Measure-Object | ForEach-Object { $_.Count }
# Expected: at least 2

## Visual check (browser, hard refresh Ctrl+F5)
- Cart drawer is still hidden on load (no visual change yet — JS comes in Prompt 2).
- No console errors.

## Commit
git add assets/css/cart.css
git commit -m "style: complete cart UI stylesheet (drawer internals, totals, checkout modal, a11y polish)"
```

---

## 🔧 PROMPT 2 — Rebuild cart.js to drive the real drawer (full file replacement)

```
## Goal
Replace assets/js/cart.js entirely. The old file injects an unstyled legacy
cart panel at the end of <body>; that must disappear. The new file drives the
EXISTING #cartDrawer markup on every page, exposes window.KxmCart
(product.html already calls window.KxmCart.addItem(...)), and auto-creates
the drawer on any page that lacks the markup (e.g. lookbook.html).

## Strict Scope
- ONLY touch: assets/js/cart.js
- DO NOT edit any .html file in this prompt.
- DO NOT run git push. Commit only.

## Steps
1. BEFORE overwriting, check the old storage key so existing demo carts survive:
   Select-String -Path "assets\js\cart.js" -Pattern "localStorage"
   If the old key differs from 'kxm_cart', use that key in the new file below.
2. Select ALL content of assets/js/cart.js, delete it, and save the following
   EXACTLY (UTF-8 — it contains ₹ and − characters):

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
  var STORAGE_KEY = 'kxm_cart';

  /* ── State ─────────────────────────────────────────── */
  var items = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
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

3. Save the file (UTF-8).

## Verify (PowerShell 5.1)
Select-String -Path "assets\js\cart.js" -Pattern "KxmCart" | Measure-Object | ForEach-Object { $_.Count }
# Expected: 2 or more
Select-String -Path "assets\js\cart.js" -Pattern "createElement|insertAdjacentHTML" | Measure-Object | ForEach-Object { $_.Count }
# Expected: 3 or more (auto-injection exists)

## Visual check (browser, Ctrl+F5, on index AND shop AND product)
- The unstyled cart panel at the END of the page is GONE on every page.
- Click "Cart" in the nav (index) / footer: the 420px drawer slides in from
  the right with a dimmed backdrop; "My Cart" + empty state styled.
- On product.html: click ADD TO CART → drawer opens with the item (image,
  name, size, price, qty stepper). Increase/decrease/remove work; subtotal
  updates in Indian number format (₹30,435).
- Click CHECKOUT → drawer closes, centered demo modal appears; close via ×,
  backdrop click, and Esc.
- Esc also closes the drawer; background scroll is locked while open.

## Commit
git add assets/js/cart.js
git commit -m "feat: rebuild cart.js — drive existing drawer, KxmCart API, modal wiring, remove legacy injected panel"
```

---

## 🔧 PROMPT 3 — Repair the extended (fullscreen) menu

```
## Goal
Fix the slide-down menu overlay on index.html AND product.html: (a) it must
cover the full viewport so "MY CART" and "JOIN THE FAM" never render outside
the white panel, and (b) the giant menu links must be dark and readable
instead of 22%-opacity grey.

## Strict Scope
- ONLY touch: index.html and product.html — ONLY the <style> blocks.
- Do not change the menu's HTML structure, links, or text.
- Do not touch shop.html (its nav intentionally has no menu).
- Do not run git push. Commit only.

## Steps (apply identically in BOTH index.html and product.html)
1. In the .menu-overlay rule, REPLACE:
        height: 55vh;
        min-height: 480px;
   WITH:
        height: 100vh;
        height: 100dvh;
        overflow-y: auto;

2. In the .menu-link rule, REPLACE:
        font-weight: 700;
   WITH:
        font-weight: 600;
   and REPLACE:
        color: rgba(2,2,2,0.22);
   WITH:
        color: rgba(2,2,2,0.82);
   and REPLACE:
        font-size: clamp(2rem, 5vw, 3.8rem);
   WITH:
        font-size: clamp(2rem, 5vw, 3.4rem);

3. In the .menu-link transition property, REPLACE the whole line:
        transition: color 0.3s ease, text-decoration-color 0.3s ease;
   WITH:
        transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s ease, text-decoration-color 0.25s ease;
        opacity: 0;
        transform: translateY(16px);
   (keep these three lines together inside .menu-link)

4. In the .menu-link:hover / .menu-link.active rule, REPLACE:
        color: rgba(2, 2, 2, 0.85);
        text-decoration-color: rgba(2, 2, 2, 0.35);
   WITH:
        color: var(--black);
        text-decoration-color: rgba(2, 2, 2, 0.45);

5. Immediately AFTER the .menu-link:hover/.active rule, ADD this block:
    body.menu-open .menu-link {
      opacity: 1;
      transform: translateY(0);
    }
    body.menu-open .menu-main-links .menu-link:nth-child(1) { transition-delay: 0.10s, 0.10s, 0s, 0s; }
    body.menu-open .menu-main-links .menu-link:nth-child(2) { transition-delay: 0.16s, 0.16s, 0s, 0s; }
    body.menu-open .menu-main-links .menu-link:nth-child(3) { transition-delay: 0.22s, 0.22s, 0s, 0s; }
    body.menu-open .menu-main-links .menu-link:nth-child(4) { transition-delay: 0.28s, 0.28s, 0s, 0s; }

   (The scroll lock for body.menu-open already lives in assets/css/cart.css
   from Prompt 1 — do not duplicate it here.)

## Verify (PowerShell 5.1)
Select-String -Path "index.html","product.html" -Pattern "55vh"
# Expected: no output
Select-String -Path "index.html","product.html" -Pattern "rgba\(2,2,2,0\.22\)"
# Expected: no output
Select-String -Path "index.html","product.html" -Pattern "100dvh" | Measure-Object | ForEach-Object { $_.Count }
# Expected: 2

## Visual check (browser, Ctrl+F5, index + product page)
- Open the menu: white panel covers the FULL viewport height; no grey strip
  below it; MY CART / JOIN THE FAM sit inside the white area at the bottom.
- Links are dark grey-black and readable at rest; full black with underline
  on hover; links rise in with a small stagger on open.
- Background does not scroll while the menu is open; X toggle closes it.

## Commit
git add index.html product.html
git commit -m "fix: fullscreen menu overlay — full-height panel, readable links, staggered entrance"
```

---

## 🔧 PROMPT 4 — Hover-image repair (rename → reconcile → failure-proof CSS)

```
## Goal
Make the "Current Collection" hover work: every img reference in every HTML
file must point to a file that ACTUALLY exists in assets/images (exact name,
no stray spaces, lowercase kebab-case), and the hover crossfade must degrade
gracefully if any alternate image is missing.

## Strict Scope
- Touch: files inside assets/images/ (renames only) and ALL *.html files in
  the project root that reference those images (index.html, shop.html,
  product.html, lookbook.html, and any others that exist).
- Do not add, remove, or "improve" any product data other than image paths.
- Do not run git push. Commit only.

## Steps
1. INVENTORY — list the real files:
   Get-ChildItem assets\images | Select-Object -ExpandProperty Name

2. RENAME to space-free kebab-case (only files that need it). Expected map —
   adjust to reality if your inventory shows different names:
     "Noir Trench.png"              -> noir-trench.png
     "Skill Bandana.png"            -> silk-bandana.png   (fixes old typo)
     "Canvas Tote.png"              -> canvas-tote.png
     "Woll Scarf.png"               -> wool-scarf.png     (fixes old typo)
     "Linen Shirt.png"              -> linen-shirt.png
     "Leather Belt.png"             -> leather-belt.png
     "Hero Image.png"               -> hero-image.png
     "KXM black text trans bg logo.png" -> kxm-logo.png
     "product- 2a.png"              -> product-2a.png
     "product- 3a.png"              -> product-3a.png
     "collection-women a.png"       -> collection-women-a.png
     "collection-accessories a.png" -> collection-accessories-a.png
     "lookbook- 1.png"              -> lookbook-1.png
   PowerShell pattern (quote names with spaces):
     Rename-Item -LiteralPath "assets\images\product- 2a.png" -NewName "product-2a.png"
   If a listed file does not exist in the inventory, SKIP its rename and note
   it — do not invent files.

3. UPDATE REFERENCES in every root *.html file so each old path becomes the
   exact new name (this includes <img src>, the productsData image arrays in
   product.html, and the og:image / twitter:image meta URLs). Examples:
     assets/images/product- 2a.png            -> assets/images/product-2a.png
     assets/images/collection-women a.png     -> assets/images/collection-women-a.png
     assets/images/Skill Bandana.png          -> assets/images/silk-bandana.png
     assets/images/Hero%20Image.png           -> assets/images/hero-image.png
     assets/KXM black text trans bg logo.png  -> assets/kxm-logo.png
   IMPORTANT for product.html: the arrays inside productsData
   (images / editorialImages) must be updated too — they are JS strings, not
   HTML attributes.

4. FAILURE-PROOF HOVER (index.html only) — in the <style> block REPLACE:
      .product-card:hover .product-card-img img.default-img {
        opacity: 0;
        transform: scale(1.04);
      }
   WITH:
      .product-card:hover .product-card-img img.default-img {
        transform: scale(1.04);
      }
   (The default image now NEVER disappears; the hover image fades in on top
   of it. If a hover file is missing, the card simply keeps showing the
   default image instead of turning into a white card. cart.js from Prompt 2
   also auto-removes broken .hover-img elements.)

5. CROSS-CHECK that every referenced image exists. Run and fix anything it flags:
   $imgs = Get-ChildItem assets\images | ForEach-Object { $_.Name }
   Select-String -Path *.html -Pattern 'assets/(images/)?([^"''#?]+\.(png|jpg|jpeg|webp|svg|otf))' -AllMatches |
     ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[2].Value } |
     Sort-Object -Unique | ForEach-Object {
       $n = [uri]::UnescapeDataString($_)
       if ($imgs -notcontains $n) { Write-Host "MISSING: $n" -ForegroundColor Red }
     }
   Write-Host "Check complete."
   Note: Windows is case-insensitive but Vercel is NOT — the renames in
   step 2 make everything lowercase, so keep references exactly as renamed.

## Verify (PowerShell 5.1)
Select-String -Path *.html -Pattern 'product- 2a|product- 3a|women a\.png|accessories a\.png|lookbook- 1|Skill Bandana|Woll Scarf|Hero%20Image'
# Expected: no output
Select-String -Path "index.html" -Pattern "default-img"
# Expected: the :hover .default-img rule contains ONLY transform: scale(1.04);
# (no opacity line). The non-hover .hover-img base rule keeps its opacity: 0 —
# that one is correct and must stay.

## Visual check (browser, Ctrl+F5)
- Homepage "Current Collection": hover EVERY card — the worn/alternate image
  crossfades in (or the default stays put if an alternate is genuinely
  missing). NO card ever turns into a white/blank card on hover.
- product.html: open 3–4 products — main image + thumbnails all render.
- Shop grid: all 12 product images render (including renamed noir-trench,
  silk-bandana, wool-scarf).

## Commit
git add -A
git commit -m "fix: reconcile all image references with real filenames; rename assets to kebab-case; failure-proof hover crossfade"
```

---

## 🔧 PROMPT 5 — Typography upgrade: retire Arial, adopt Instrument Sans

```
## Goal
The PP Neue Montreal / PP Editorial New OTFs are not deployed (assets/fonts/
404s), so --font-primary resolves to Arial and the whole site renders in
system Arial. Swap the primary UI font to Instrument Sans (Google Fonts,
free license, visually the closest free relative of Neue Montreal). Display
headings already fall back to Instrument Serif and stay as they are.

## Strict Scope
- ONLY touch: the Google Fonts <link> line and the --font-primary token in
  the <style> block of every root *.html page (index.html, shop.html,
  product.html, lookbook.html, and any other pages that exist).
- DO NOT change font sizes, weights, letter-spacing, or any other CSS.
- DO NOT touch assets/fonts/ or the @font-face declarations (they are dead
  code today and harmless; leave them).
- Do not run git push. Commit only.

## Steps (on every root *.html page)
1. REPLACE the Google Fonts <link> href:
      https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap
   WITH:
      https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap

2. In the :root design tokens, REPLACE:
      --font-primary:   Arial, sans-serif;
   WITH:
      --font-primary:   'Instrument Sans', Arial, sans-serif;
   (Keep the exact variable name and surrounding formatting.)

## Verify (PowerShell 5.1)
Select-String -Path *.html -Pattern "font-primary:\s*Arial"
# Expected: no output
Select-String -Path *.html -Pattern "Instrument\+Sans" | Measure-Object | ForEach-Object { $_.Count }
# Expected: equal to the number of root HTML pages

## Visual check (browser, Ctrl+F5)
- Nav labels, section labels, product names, buttons, and footer links now
  render in Instrument Sans (geometric grotesque, slightly tighter than
  Arial). Headlines in serif are unchanged.

## Commit
git add -A
git commit -m "style: adopt Instrument Sans as primary UI font across all pages"
```

---

## 🔧 PROMPT 6 — Homepage polish pass

```
## Goal
Lift the homepage's finish: make marquee cards clickable, fade the marquee
edges, fix dead story links, add hero CTA hover feedback, and close two
responsive gaps.

## Strict Scope
- ONLY touch: index.html.
- Do not alter section order, copy, prices, or the "More Than Just Fashion"
  statement block.
- Do not run git push. Commit only.

## Steps
1. Make the six ORIGINAL marquee cards clickable by changing each
   <article class="product-card"> to an anchor (keep the inner markup
   unchanged). Mapping:
     product-1 card            -> <a class="product-card" href="product.html?id=obsidian-blazer">
     product-2 card            -> <a class="product-card" href="product.html?id=ivory-wide-leg">
     product-3 card            -> <a class="product-card" href="product.html?id=dusk-overcoat">
     collection-women card     -> <a class="product-card" href="product.html?id=silence-dress">
     collection-accessories    -> <a class="product-card" href="product.html?id=archive-set">
     lookbook (White Edition)  -> <a class="product-card" href="product.html?id=white-edition">
   For the six DUPLICATE cards (the aria-hidden="true" set) do the same but
   add tabindex="-1" so keyboard users never tab into hidden duplicates:
     <a class="product-card" href="..." aria-hidden="true" tabindex="-1">
   Change their closing </article> tags to </a> as well.

2. Because <a> is inline, add this CSS right after the existing
   .product-card rule in the <style> block:
      a.product-card {
        display: block;
        text-decoration: none;
        color: inherit;
      }

3. Marquee edge fade — inside the existing .products-marquee rule ADD:
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%);
      mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%);

4. Dead story links — give these anchors real destinations:
      <a class="content-block-link">[Read our story]</a>
        -> href="lookbook.html"
      <a class="content-block-link">[Our sourcing]</a>
        -> href="#brand-statement"
   Leave [Shop all] (already -> shop.html) and
   [Book an appointment] (already -> #newsletterForm) unchanged.

5. Hero CTA hover feedback — ADD after the .hero-cta-sub rule:
      .hero-cta { transition: opacity 0.3s ease; }
      .hero-cta:hover { opacity: 0.82; }
      .hero-cta:hover .hero-cta-sub { color: rgba(255,255,255,0.95); }
      .hero-cta-sub { transition: color 0.3s ease; }

6. Responsive gaps — APPEND at the very end of the <style> block (after the
   existing @media block):
      @media (max-width: 900px) {
        #brand-intro { grid-template-columns: 1fr; }
        .brand-intro-right { padding-left: var(--margin); padding-right: var(--margin); }
        .brand-intro-footer { grid-column: auto; }
        #lifestyle { height: 62vh; min-height: 420px; }
      }
   (Do not modify the existing @media block; this is a second, separate one.)

## Verify (PowerShell 5.1)
Select-String -Path "index.html" -Pattern '<article class="product-card"'
# Expected: no output (all cards are anchors now)
Select-String -Path "index.html" -Pattern 'mask-image' | Measure-Object | ForEach-Object { $_.Count }
# Expected: 2 (prefixed + standard)
Select-String -Path "index.html" -Pattern '<a class="content-block-link">' 
# Expected: no output (all content-block links now have hrefs)

## Visual check (browser, Ctrl+F5, desktop + 400px-wide mobile emulation)
- Hovering a marquee card pauses the strip; clicking opens the correct PDP.
- Marquee fades out softly at both viewport edges instead of hard-clipping.
- Keyboard Tab never enters duplicate cards; visible focus rings appear.
- At phone width: brand intro stacks logo-above-text; lifestyle image is
  ~62vh; nothing overflows horizontally.

## Commit
git add index.html
git commit -m "feat: homepage polish — clickable marquee cards, edge fade, real story links, CTA hover, mobile gaps"
```

---

## 🔧 PROMPT 7 — Shop page polish pass

```
## Goal
Give the shop grid tactile feedback: gentle image zoom on hover and a
subtle name color shift, matching the Odd Ritual restraint.

## Strict Scope
- ONLY touch: shop.html (its <style> block only).
- Do not change grid structure, product data, or the title bar.
- Do not run git push. Commit only.

## Steps
1. In the <style> block, ADD after the .product-img-container img rule:
      .product-img-container img {
        transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      .product-card:hover .product-img-container img {
        transform: scale(1.04);
      }

2. ADD after the .product-name rule:
      .product-name { transition: color 0.25s ease; }
      .product-card:hover .product-name { color: var(--light-faded); }
   (Name dims a touch on hover — the "View Product" underline action already
   appears; together they read as one intentional hover state.)

## Verify (PowerShell 5.1)
Select-String -Path "shop.html" -Pattern "scale\(1.04\)" | Measure-Object | ForEach-Object { $_.Count }
# Expected: 1

## Visual check
- Hover any grid card: image zooms gently, "View Product" appears, name
  dims slightly. Click still navigates to the correct product page.

## Commit
git add shop.html
git commit -m "style: shop grid hover polish — image zoom and name shift"
```

---

## 🔧 PROMPT 8 — Product page polish pass

```
## Goal
Finish the PDP's interactive details: size buttons respond to hover, the
ADD TO CART button inverts on hover and holds a clean ADDED state,
thumbnails dim on hover, and "Complete the Look" cards zoom gently.

## Strict Scope
- ONLY touch: product.html (its <style> block only).
- Do not touch the productsData JS, accordions logic, or gallery logic.
- Do not run git push. Commit only.

## Steps — ADD each rule AFTER its base rule already exists in the <style> block:
1. After .size-btn:
      .size-btn { transition: border-color 0.25s ease, color 0.25s ease; }
      .size-btn:hover { border-color: var(--black); }

2. After .add-to-cart-btn:
      .add-to-cart-btn {
        transition: background 0.25s ease, color 0.25s ease;
        box-shadow: inset 0 0 0 1px var(--black);
      }
      .add-to-cart-btn:hover { background: var(--white); color: var(--black); }
      .add-to-cart-btn.added { background: var(--white); color: var(--black); letter-spacing: 0.18em; }

3. After .thumbnail-card:
      .thumbnail-card { transition: opacity 0.25s ease; }
      .thumbnail-card:not(.active):hover img { opacity: 0.75; }

4. After .look-img-container img:
      .look-img-container img { transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      .look-card:hover .look-img-container img { transform: scale(1.04); }

## Verify (PowerShell 5.1)
Select-String -Path "product.html" -Pattern "add-to-cart-btn:hover"
# Expected: 1 match
Select-String -Path "product.html" -Pattern "size-btn:hover"
# Expected: 1 match

## Visual check
- Size buttons highlight on hover; selected state unchanged.
- ADD TO CART inverts on hover; after click it reads ADDED (inverted) and
  the cart drawer opens via the new cart.js.
- Thumbnails dim on hover (active thumb untouched); Complete the Look
  images zoom gently on hover.

## Commit
git add product.html
git commit -m "style: PDP polish — size hover, button invert, thumbnail and look-card feedback"
```

---

## 🔧 PROMPT 9 — Final QA sweep + integration check

```
## Goal
Verify the whole site end-to-end after Prompts 1–8, fix ONLY defects found
(yes — fix them in this prompt), and leave the repo clean.

## Strict Scope
- Touch: whatever a found defect requires; note each fix in the commit body.
- No new features. No copy changes. Do not run git push. Commit only.

## Steps
1. Console check on every page (index, shop, product, lookbook, any others):
   DevTools → Console must be free of red errors. Note: a handful of 404s for
   assets/fonts/*.otf are a KNOWN pre-existing condition (fonts are dead
   code) — do not chase them this round.
2. Cart end-to-end: add Obsidian Blazer (M) + Silk Bandana (no size) +
   Archive Set; reload the page → cart survives (localStorage); qty math and
   subtotal correct; remove works; drawer + modal behave on all pages.
3. Menu end-to-end on index and product: open, hover each link, navigate,
   verify Esc + X + backdrop all close it; verify it never scrolls the body.
4. Hover sweep: all 6 homepage cards + shop grid + PDP thumbnails.
5. Mobile emulation (390px): index hero, marquee, menu, cart drawer
   (full-width), shop grid single column, PDP gallery, footer stacks.
6. Cross-check image references one last time with the MISSING-script from
   Prompt 4 step 5 — output must be silence.
7. Lighthouse quick pass (optional, informational): aim for no layout shift
   regressions from the font swap; do not chase performance scores this round.

## Verify
All checks above pass with no red console errors and no visual defects.

## Commit
git add -A
git commit -m "chore: round-2 QA sweep — integration fixes and final checks"
```

---

# PART D — DEFINITION OF DONE

Tick every line before you push:

- [ ] No unstyled cart panel anywhere on the site (end-of-page artifact gone)
- [ ] Cart opens as a 420px right drawer from nav / menu / footer on every page — styled, with items, qty steppers, subtotal in ₹ Indian format, checkout modal
- [ ] Cart contents survive a page reload
- [ ] Menu covers the full viewport on index + product; links dark and readable; MY CART / JOIN THE FAM inside the white panel
- [ ] All six homepage cards swap to their worn/alternate image on hover; no card ever goes white
- [ ] All image references cross-check clean (MISSING script silent)
- [ ] Site renders in Instrument Sans everywhere; serif headlines unchanged
- [ ] Homepage marquee cards click through to correct PDPs
- [ ] Shop grid, PDP buttons, thumbnails, look-cards all have quiet hover feedback
- [ ] 390px emulation: no horizontal scroll on any page
- [ ] Console clean (except the known assets/fonts 404s)
- [ ] 9 commits, one per prompt, none pushed

# PART E — INTENTIONALLY OUT OF SCOPE (already tracked from Round 1)

Do **not** fold these into this round — they have their own prompts in the Round-1 pack or are queued for later:

1. `og:url` / `twitter:url` still point to `https://kxm.com` (needs your real domain decision first).
2. Legal pages (Privacy / Refunds / Shipping / ToS) and 404 page — separate build round.
3. Security headers via `vercel.json` — infra round.
4. Newsletter form is demo-only (client-side success) — Formspree wiring is its own task.
5. Deploying the real PP Neue Montreal / Editorial New OTFs if you ever license them — the `@font-face` blocks are already waiting; Instrument Sans stays the safe default until then.

**Rollback note:** every prompt is its own commit — if anything misbehaves after deploy, `git revert <hash>` of that single commit restores it cleanly.


