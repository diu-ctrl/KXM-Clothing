# KXM — K1 SPEC (Image Rescue: 92.5 MB → 0.79 MB)

**Executor:** Antigravity
**Production URL:** https://kxm-by-divyaraj.vercel.app
**Context:** K0 independent audit confirmed the "slow loading / laggy" complaint is ~95% one problem:
24 raw camera-master PNGs (2048×2048 / 2816×1536, RGBA, never resized or compressed) totalling
92.5 MB. A normal desktop visit downloads 42–85 MB on home/shop; a product page's main visual took
11.5 s to appear on a throttled Fast-3G mobile profile; shop scrolling produced 166.7 ms frames
from main-thread PNG decodes. K1 replaces every image with a role-sized WebP (measured total:
0.79 MB, 99.1% smaller), fixes layout shift with width/height attributes, and preloads the hero.
No design, layout, copy, or functionality changes — same pixels, right format, right size.

## Rules
1. Verify SHA256 against `PACKAGE-MANIFEST.txt` first (`sha256sum -c PACKAGE-MANIFEST.txt`).
2. Run `node test_k1.js` in the repo root BEFORE deploying: RESULT must be `FAIL 0` with zero SKIP lines.
3. Apply files exactly as shipped; do NOT hand-edit. `assets/js/cart.js`, `assets/css/cart.css`,
   `404.html`, `favicon/*`, and the four legal pages are NOT in this package and must not change
   (test gates C01–C04).
4. Do NOT delete the old `.png` files in `assets/images/`. They stay for now — og:image tags point
   at `hero-image.png` (social previews must not be WebP) and unused files cost nothing. Cleanup
   is a later phase after live verification.
5. No live POSTs needed or allowed.

## Files (repo-relative)
- `assets/images/*.webp` — 24 ADD files (the new WebP images; total 0.79 MB)
- `index.html` (REPLACE — 14 img srcs png→webp, width/height on every img, decoding="async" on
  13 below-fold imgs, hero `<link rel="preload" as="image" fetchpriority="high">` added, marquee
  template imgs now emit width/height via the new `window.KXM_IMG_ATTRS()` helper)
- `about.html`, `contact.html`, `lookbook.html` (REPLACE — same treatment: 3/1/7 img swaps + dims)
- `product.html` (REPLACE — main image placeholder swap + dims; 3 JS template imgs now emit dims)
- `assets/js/products.js` (REPLACE — all 38 product image paths png→webp; adds
  `window.KXM_IMG_DIMS` (24 entries) and `window.KXM_IMG_ATTRS(src)` helpers before the READY flag)
- `assets/js/shop.js` (REPLACE — the two grid template imgs now emit dims via the helper)
- `test_k1.js` (ADD), `KXM-K1-PROMPT.md` (ADD), `PACKAGE-MANIFEST.txt` (REPLACE)

## Change details
- K1-1 **Encoding**: every PNG re-encoded to WebP at the largest size it is ever displayed
  (hero 1920w, lookbook-1 1400w, collection/product tiles 1200w or native 1024w, logo 384w q85,
  everything else q80). Measured sizes are in the manifest. The logo is one file (384×407) serving
  all four instances (intro, sticky header, about ethos, footer) — browser caches it once.
- K1-2 **Cache-busting by rename**: image cache headers are `max-age=31536000, immutable`, so the
  png→webp rename (new URLs) is what guarantees users actually fetch the new files. Nothing is
  overwritten in place.
- K1-3 **width/height on every img** (static and JS-rendered): the browser reserves the correct
  aspect-ratio box before pixels arrive — layout stops jumping while images load (CLS ≈ 0).
  Attributes match the shipped WebP intrinsic sizes exactly.
- K1-4 **Hero priority**: `<link rel="preload" as="image" href="assets/images/hero-image.webp"
  fetchpriority="high">` + the hero img keeps `loading="eager"`. The hero drops 3.25 MB → 35 KB
  and starts downloading immediately instead of being discovered late.
- K1-5 **decoding="async"** on all below-fold images: giant decodes can no longer block the main
  thread mid-scroll (the "laggy" feel).
- K1-6 **og:image untouched**: still `hero-image.png` (kept on disk). Social platforms are
  unreliable with WebP previews; PNG stays for sharing.
- K1-7 Old PNGs remain on disk unreferenced (except the og:image PNG) — removable in a later
  cleanup phase.

## Expected effect (measured in K0/K1 verification)
- Home: 42–67 MB → ≈ 1 MB · Shop: 51–86 MB → ≈ 0.9 MB · Product: 17 MB → ≈ 0.7 MB
- Fast-3G product LCP: 11.5 s → ~2–3 s · shop scroll jank: gone (decodes now async + tiny)
- Visual output: same images, same layout, same interactions — only the bytes change.

## Live gates (report each)
- L01: `sha256sum -c PACKAGE-MANIFEST.txt` → all OK
- L02: `node test_k1.js` in repo root → `FAIL 0`, zero SKIP
- L03: deployed index.html, about.html, contact.html, lookbook.html, product.html,
  assets/js/products.js, assets/js/shop.js byte-identical to package files
- L04: live network check on / : every image request returns 200, no request to any
  assets/images/*.png except og:image-related crawler fetches; total transfer ≈ 1 MB
- L05: visual spot-check: hero renders sharp, product cards/grids unchanged, hover swap still
  works on shop cards, logo crisp in header/footer, lookbook/about/contact images fine
- L06: mobile spot-check (DevTools iPhone viewport): no layout jumping while images load
- L07: cart.js, cart.css, 404.html, favicon/*, legal pages unchanged (sha256 vs pre-K1)
- L08: report the Vercel deployment ID + commit hash

## Report format
[STEP x/N] log · files copied · L01–L08 outputs · deployment ID · anything skipped + why.
Redacted: no secrets/tokens/personal data.
