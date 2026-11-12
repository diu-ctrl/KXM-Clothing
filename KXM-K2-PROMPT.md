# KXM — K2 SPEC (Shop CLS Kill + Outline/Landmark/OG Fixes)

**Executor:** Antigravity
**Production URL:** https://kxm-by-divyaraj.vercel.app
**Context:** K1 post-deploy audit (18/18 gates PASS) confirmed the image problem is solved
(43.5 MB → 0.87 MB home payload, CLS 0 on all pages EXCEPT shop). K2 fixes the one remaining
measured defect — shop page layout shift CLS 0.376 (the footer jumps ~1700px when shop.js
populates the empty grid at ~421 ms) — plus four verified quality defects found in the
full-site walkthrough: missing h1 headings on shop/lookbook/legal pages, a missing <main>
landmark on about.html, and missing Open Graph / Twitter card tags on product.html.
All changes are static-HTML-only: zero JS, zero CSS, zero image changes.

## Rules
1. Verify SHA256 against `PACKAGE-MANIFEST.txt` first (`sha256sum -c PACKAGE-MANIFEST.txt`).
2. Run `node test_k2.js` in the repo root BEFORE deploying: RESULT must be `FAIL 0` with zero SKIP lines.
   (A01 byte-compares the static shop grid against what shop.js renders — it must match exactly.)
3. Apply files exactly as shipped; do NOT hand-edit. `index.html`, `contact.html`, `404.html`,
   `assets/js/cart.js`, `assets/css/cart.css`, `assets/js/products.js`, `assets/js/shop.js`,
   `favicon/*`, and every file under `assets/images/` are NOT in this package and must not change
   (test gate C01 locks their sha256).
4. Do NOT delete or move any images. No live POSTs needed or allowed.

## Files (repo-relative) — 8 REPLACE
- `shop.html` (REPLACE — the only functional fix: the 12 product cards are prerendered inside
  `<div class="shop-grid" id="shopGrid">` so the grid occupies its full height from first paint.
  The markup is byte-identical to what `renderGrid()` builds (verified by gate A01), so the
  runtime innerHTML replacement becomes a layout no-op. Footer no longer jumps. Reveal/IO,
  filters, sorting, counts all unchanged. ALSO: `<div class="title-left">ALL PRODUCTS</div>`
  → `<h1 class="title-left">ALL PRODUCTS</h1>` — the page's first real h1.)
- `lookbook.html` (REPLACE — `<h2 class="closing-statement js-reveal">Worn by people, not
  mannequins.</h2>` → `<h1 ...>`. Page previously had NO h1. Same classes, same styling.)
- `product.html` (REPLACE — `<h3 class="complete-look-label">COMPLETE THE LOOK</h3>` → `<h2 ...>`
  (fixes h1→h3 outline skip); ADDS the og:type/og:url/og:title/og:description/og:image and
  twitter:card/url/title/description meta tags after the existing meta description. og:image is
  the absolute URL of `assets/images/hero-image.png` (PNG on purpose — same convention as index).)
- `about.html` (REPLACE — `<header class="about-hero" id="main">` → `<main id="main"><header
  class="about-hero">` and a matching `</main>` inserted right before `<!-- FOOTER -->`, so the
  hero + manifesto + ethos sections are wrapped in a proper main landmark, same pattern the
  legal pages already use. No visual change: <main> is an unstyled block wrapper.)
- `privacy-policy.html`, `returns.html`, `shipping.html`, `terms-of-service.html` (REPLACE —
  `<div class="legal-title-left">X</div>` → `<h1 class="legal-title-left">X</h1>`. Legal pages
  previously had NO h1. Class-preserved, zero styling change.)
- `test_k2.js` (ADD), `test_k2_invariants.json` (ADD), `KXM-K2-PROMPT.md` (ADD),
  `PACKAGE-MANIFEST.txt` (REPLACE)

## Change details
- K2-1 **Shop CLS kill (prerender, not CSS)**: the shift existed because first paint could happen
  before shop.js ran, showing an empty grid. Prerendering the exact 12-card markup (6,877 bytes,
  ids in catalog order, hover imgs for the 6 two-image products, width/height/decoding attrs from
  KXM_IMG_ATTRS) reserves the full layout from first paint. shop.js is byte-untouched: it still
  re-renders the same markup on load and on every filter/sort interaction. The `.js-reveal`
  override rule in shop.css-equivalent inline styles already forces cards visible, so there is
  no hidden-cards flash risk.
- K2-2 **Heading outline**: shop ("ALL PRODUCTS"), lookbook ("Worn by people, not mannequins.")
  and the 4 legal pages ("PRIVACY POLICY" / "RETURNS" / "SHIPPING" / "TERMS OF SERVICE") each
  gain exactly one h1; product.html's "COMPLETE THE LOOK" drops h3→h2 fixing the h1→h3 skip.
  Every changed tag keeps its class attribute; no h1/h2/h3 element-selector rules exist in any
  page's CSS (verified) and a universal margin reset exists, so appearance is unchanged.
- K2-3 **about.html landmark**: <main> now wraps about-hero + manifesto + ethos sections;
  skip-link target id="main" preserved on the <main> element itself.
- K2-4 **product.html social cards**: og/twitter tags mirror index.html's format exactly
  (og:title "KXM — Product Details", og:image absolute URL to hero-image.png). No prices are
  invented anywhere.

## Expected effect (measured in K1 audit)
- Shop CLS: 0.376 → 0.000 (single shift event at ~421 ms eliminated)
- Heading outline violations: 7 pages → 0 (404.html intentionally has no headings)
- about.html main landmark: added; product.html og/twitter: complete
- Visual output: pixel-identical everywhere (no CSS/JS/image changes)

## Live gates (report each)
- L01: `sha256sum -c PACKAGE-MANIFEST.txt` → all OK
- L02: `node test_k2.js` in repo root → `FAIL 0`, zero SKIP
- L03: deployed shop.html, lookbook.html, product.html, about.html, privacy-policy.html,
  returns.html, shipping.html, terms-of-service.html byte-identical to package files
- L04: live check `/shop.html`: the 12 product cards are present in the static HTML response
  itself (curl | grep 'product-card' → 12) and CLS ≈ 0 on a fresh mobile profile
- L05: visual spot-check: shop grid renders identically (cards, hover swap, filters, sort),
  about page layout unchanged, legal title bars unchanged, product page + sharing preview OK
- L06: index.html, contact.html, cart.js, cart.css, products.js, shop.js, 404.html, favicon/*,
  assets/images/* unchanged (test gate C01 + spot sha256)
- L07: report the Vercel deployment ID + commit hash

## Report format
[STEP x/N] log · files copied · L01–L07 outputs · deployment ID · anything skipped + why.
Redacted: no secrets/tokens/personal data.
