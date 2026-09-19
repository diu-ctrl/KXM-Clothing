# KXM. Website — Full Audit, Strategy & Antigravity Execution Plan

> **Prepared for:** Divyaraj Chauhan · https://kxm-by-divyaraj.vercel.app/
> **Prepared by:** Super Z (z.ai) · September 19, 2026
> **How to use this file:** Sections 1–5 are the research and strategy — read them once. Section 6 contains **12 copy-paste-ready Antigravity prompts**. Feed them to Antigravity **one at a time, in order** (they have dependencies). After each prompt: Antigravity commits (never pushes), you push via GitHub Desktop, Vercel redeploys, you run the browser check listed for that phase in Section 7. Then move to the next prompt.

---

## 1. Project snapshot (verified live, September 19, 2026)

| Item | State |
|---|---|
| Live URL | https://kxm-by-divyaraj.vercel.app/ |
| Pages that exist | `/` (index), `/shop.html`, `/product.html` — **only 3 pages** |
| Hosting | Vercel, static, auto-deploy on push to `main` |
| Cart | `assets/js/cart.js` — localStorage cart (`kxm_cart_items`), drawer UI, qty steppers, remove, subtotal, demo checkout modal. Solid code. |
| Design system | Near-black `#020202` / white `#ffffff` / light-grey `#f4f4f4`, Instrument Serif italic voice, lowercase "kxm." wordmark, Odd-Ritual-style layout (menu overlay slides down, cart drawer slides right) |
| Intended fonts | PP Neue Montreal (sans) + PP Editorial New (serif) — local OTF files in `assets/fonts/` |
| Product catalog | 12 products, data hardcoded twice (shop grid markup + `productsData` object inside product.html) |
| Currency | INR (₹), en-IN formatting — consistent |
| robots.txt / sitemap.xml | **Missing (404)** |
| Custom 404 page | **Missing** — Vercel serves the default bare `NOT_FOUND` |
| vercel.json / security headers | **Missing** — only Vercel's default HSTS is present |
| Favicon | Single `favicon.png` only — no apple-touch-icon, no webmanifest |
| Reference site | oddritualgolf.com (Webflow + Shopify) — KXM is the portfolio adaptation of its design language |

**Confirmed live-URL probe results (evidence):**

```
200  /                          200  /assets/js/cart.js
200  /shop.html                 200  /assets/css/cart.css
200  /product.html              200  /assets/images/favicon.png
404  /about.html                404  /assets/fonts/PPNeueMontreal-Book.otf
404  /lookbook.html             404  /assets/fonts/PPEditorialNew-Regular.otf
404  /contact.html              404  /robots.txt
404  /privacy-policy.html       404  /sitemap.xml
404  /terms-of-service.html     404  /404.html  (no custom 404)
```

All referenced product images return 200 — nothing is visually broken today. The problems are structural, and they are listed below with evidence.

---

## 2. THE CRITICAL FINDING — your fonts are not actually live

This is the single most important discovery of this audit, and you need to know it even though it is good news disguised as bad news.

Every page declares PP Neue Montreal and PP Editorial New via `@font-face` pointing at `assets/fonts/*.otf`, with a comment saying *"Drop PP Neue Montreal & PP Editorial New files into assets/fonts/ when available."* **Those files were never uploaded.** Both probe as 404 on the live server. Because of that, two fallback chains are silently running the whole site:

- `--font-primary: Arial, sans-serif;` → **every piece of UI text on the site is rendering in Arial.** Not PP Neue Montreal. Arial.
- `--font-display: 'Ppeditorialnew', 'Instrument Serif', Georgia, serif;` → PP Editorial New fails, so the display serif you see (the "kxm." wordmark, MORE THAN JUST FASHION, the italic brand statements) is actually **Instrument Serif from Google Fonts.**

So when you say "the fonts are perfect" — what you are actually seeing and loving is *Instrument Serif* (perfect, keep it forever) and *Arial standing in for a font that never shipped* (fixable, and the fix will make the site look *more* expensive, not less).

**The solution (do not just upload the PP fonts):** PP Neue Montreal and PP Editorial New are commercial Pangram Pangram typefaces. Hosting their OTFs on a public website requires a paid web license — and as a public portfolio piece this site is exactly the kind of thing that gets screenshotted. The clean, free, license-safe move is **Instrument Sans** (Google Fonts, SIL Open Font License): it is a neo-grotesque in the same Swiss spirit as Neue Montreal, it was practically designed to pair with Instrument Serif (same foundry ecosystem, similar proportions), and it ships with a full variable weight range 400–700 + italics, which covers every weight this site uses (400/500/600/700). The visual shift from Arial → Instrument Sans is subtle but immediately reads "fashion house" instead of "default document."

**Locked decision for this project:** `--font-primary: 'Instrument Sans'` + `--font-display/--font-italic: 'Instrument Serif'`. Colors, layout, spacing, and every other brand element stay exactly as they are (see Section 4).

---

## 3. Complete audit

### A. Critical defects (broken on the live site right now)

| # | Finding | Evidence | Impact |
|---|---|---|---|
| A1 | PP fonts 404; site runs on Arial + Instrument Serif fallbacks | `/assets/fonts/*.otf` → 404; `--font-primary: Arial` | The intended typography never shipped |
| A2 | Homepage product marquee cards are **dead ends** — `<article class="product-card">` with `cursor: pointer` but no `<a>` and no click handler | index.html lines ~1507–1664 | Users can see 6 products on the homepage and cannot reach any of them. Biggest conversion hole on the site |
| A3 | Legal links are dead sitewide: Privacy Policy, Refunds, Shipping, Terms of Service all `href="#"` | footer on all 3 pages | Feels unfinished; hurts portfolio credibility |
| A4 | `[Read our story]` and `[Our sourcing]` links have **no `href` attribute at all** | index.html content blocks 01, 02 | Clicking does nothing |
| A5 | No About, Contact, or Lookbook page exists | live probe 404s | Menu says About Us / Contact but they only scroll to homepage sections |
| A6 | Open Graph / Twitter meta points to `https://kxm.com/` — a domain you don't own | `<meta property="og:url" content="https://kxm.com/">` | Shared links on WhatsApp/LinkedIn/Discord show wrong preview and wrong URL |
| A7 | No custom 404 page | Vercel bare `NOT_FOUND` JSON | Off-brand dead end |
| A8 | No robots.txt, no sitemap.xml, no canonical tags | live probe 404s | Basic SEO hygiene missing |
| A9 | Newsletter form is client-side theater — validates, fades, shows "You're on the list", stores nothing, sends nothing | index.html script | A lead-capture element that captures nothing |
| A10 | Cart inaccessible from nav on shop + product pages | shop/product nav-right only has "Close" | cart.js already renders a `#cartBadge` when `.nav-link-cart` exists — but that element is absent on 2 of 3 pages. The feature exists; the markup doesn't |

### B. UX / UI gaps (the designer's hat)

1. **No product reach from homepage** (A2 above) — the single highest-value fix.
2. **Inconsistent nav systems across pages.** Homepage: menu toggle opens overlay. Shop: the toggle is a *link home* and the right side says "Close". Product: toggle works, right side says "Close". A visitor learns three different navbars. Unify: same toggle + overlay everywhere, with a contextual right side (`Cart` always, `Close` only where it makes sense).
3. **No category awareness on shop.** 12 products in one flat grid. Two elegant chips — `ALL (12) · CLOTHING (7) · ACCESSORIES (5)` — are enough; luxury sites don't do mega-filters. A minimal `SORT` (Featured / Price low–high / Price high–low) completes it, all client-side.
4. **No hover preview on shop grid**, while the homepage marquee has a beautiful dual-image swap. Inconsistent product presentation between two pages selling the same items.
5. **Size selection is optional-but-not.** The product page pre-selects `M` silently; a visitor can add the wrong size without ever choosing. Correct pattern: nothing pre-selected, `ADD TO CART` reads `SELECT A SIZE` (disabled state) until a size is chosen.
6. **No size guide.** XS–XL with zero measurement reference is a gap on any apparel PDP. A small on-brand modal with a chest/waist/hip table fixes it.
7. **No breadcrumb or return path on the product page.** After landing on `product.html?id=leather-belt` there is no "← Shop" affordance other than the logo.
8. **Product gallery aspect-ratio is unstable.** The screenshot shows grey bands above/below the belt image — the main image container has no locked aspect ratio, so short images float in a tall grey frame. Lock to `aspect-ratio: 4/5; object-fit: cover`.
9. **Editorial grid cells are labeled but not linked** (Women's / Men's / Accessories / Lookbook). They should lead somewhere — Accessories to the filtered shop, Lookbook to a lookbook page.
10. **The newsletter success promise is false** (A9). Either wire it to Formspree or stop promising. We'll wire it (Prompt 8).
11. **Accessibility basics missing:** no `:focus-visible` styles, no skip-to-content link, marquee and parallax ignore `prefers-reduced-motion`.
12. **Hero slide numbers are dead CSS.** `.hero-slides` styles exist but no markup — either remove (chosen, keeps scope tight) or build a real 3-slide hero later (Section 3.D).

### C. Engineering & quality gaps (the developer's hat)

1. **Product data is duplicated in two places** (shop.html markup + `productsData` in product.html), and the homepage marquee hardcodes a third copy. One price change = three edits = guaranteed future drift. Fix: one `assets/js/products.js` as the single source of truth; all three surfaces render from it.
2. **Filenames are landmines:** `Skill Bandana.png` (it's silk, not skill), `Woll Scarf.png` (typo), `product- 2a.png`, `product- 3a.png`, `lookbook- 1.png`, `collection-women a.png`, `Hero Image.png`, `KXM black text trans bg logo.png`. They work only because browsers URL-encode spaces. Rename everything to kebab-case and update references.
3. **`index.html` has CRLF line endings** (the other two are LF). Normalize to LF and add a `.gitattributes` (`* text=auto eol=lf`) so this never oscillates again.
4. **No security headers** (no vercel.json at all). Your 8Bit site ships a full header set; this one ships none. Add a tight CSP (no external scripts exist — only Google Fonts — so it can be stricter than 8Bit's).
5. **No caching strategy.** After the renames (C2), image URLs become perfect cache keys — add `Cache-Control: public, max-age=31536000, immutable` for `/assets/images/*`.
6. **No structured data.** Add JSON-LD: `Organization` + `WebSite` on index, `ItemList` on shop, and a dynamically injected `Product` schema on the PDP (name, image, description, price, INR, InStock). Free portfolio points; real SEO value.
7. **Favicon set is one PNG.** No `apple-touch-icon`, no `site.webmanifest`, no 192/512 icons. Generate the full set from the existing favicon like you did for 8Bit.
8. **`cleanUrls: true` is not enabled** — URLs are `/shop.html` instead of `/shop`. Free cosmetic upgrade via vercel.json; internal `.html` links keep working via automatic 308s.
9. **Meta descriptions are static** on the PDP while the title updates dynamically. Inject the per-product description too.

### D. Elevation opportunities (optional, after the 12 prompts)

- **Real 3-slide hero carousel** using the existing `.hero-slides` 01/02/03 styling — the CSS is already written for it.
- **Lookbook horizontal-scroll page** (full-bleed editorial images, drag-to-scroll) — a strong portfolio moment.
- **A styled demo checkout flow** (`checkout.html`: shipping → demo payment → confirmation) instead of the modal — shows more frontend range to clients. Keep the demo disclaimer either way; it is good lead-gen ("If you're interested in a website like this for your brand, let's talk").
- **WebP conversion** of all product/hero images (30–60% weight cut) via `<picture>` with PNG fallback.
- **Vercel Analytics** (one click in the dashboard, zero code) to show clients real traffic numbers.

---

## 4. Brand locks — do NOT let Antigravity change these

The user has declared the branding **perfect**. These are locked. Every prompt below repeats the scope lock, but this is the master list:

1. Colors: `#020202` black, `#ffffff` white, `#f4f4f4` light grey, `#818181` faded text, `#ff3b30` error red. No new colors (except the existing focus/error states).
2. Instrument Serif italic voice — the soul of the site. Untouched.
3. Layout structures: hero → brand intro → marquee → editorial grid → ethos → lifestyle → manifesto → story → footer. Untouched (we only *link* things inside them).
4. The menu overlay (slide-down 55vh), cart drawer (slide-right), and their motion curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
5. Lowercase `kxm.` wordmark, 3.2rem display serif in the nav.
6. INR pricing and en-IN number formatting.
7. The demo checkout modal copy — it is intentional portfolio lead-gen. Untouched.
8. Footer credits: `divyarajc2@gmail.com`, `+91 99797 87087`, Instagram `@divyaraj.creates`, "Website by Divyaraj Creates". Untouched.
9. All copy that already exists (brand intro quote, ethos, manifesto, product descriptions). We create *new pages* with glue copy, but never rewrite existing text.

---

## 5. Strategy — the phased roadmap

Twelve surgical prompts, ordered by dependency and impact. Each is single-purpose (the way Antigravity performs best), each ends in its own commit, and nothing ever pushes — you push via GitHub Desktop.

| # | Prompt | One-line goal | Size | Depends on |
|---|---|---|---|---|
| 1 | Typography foundation | Ship the fonts that were never deployed: Instrument Sans + Instrument Serif, remove dead PP @font-face, LF line endings + .gitattributes | S | — |
| 2 | Asset hygiene | Rename every image to clean kebab-case (fix `Skill Bandana`, `Woll Scarf`, spaces), update every reference | S | — |
| 3 | Data layer | One `assets/js/products.js`; marquee + shop grid + PDP all render from it; marquee cards become real links (kills A2) | M | 2 |
| 4 | Homepage + meta fixes | OG/Twitter URLs to the real domain, menu/footer hrefs, dead hero CSS removal | S | 3 |
| 5 | Shop page UX | Category chips + sort + hover previews + cart in nav + unified menu overlay + editorial cell links | M | 3 |
| 6 | Product page UX | Enforced size selection + size guide modal + breadcrumb + per-product meta description | M | 3 |
| 7 | New pages I | `about.html` + `lookbook.html` in the existing design system; rewire About/Lookbook links | L | 3 |
| 8 | New pages II | `contact.html` + Formspree wiring for contact **and** the footer newsletter (real submissions at last) | M | 7 |
| 9 | New pages III | `privacy-policy.html`, `terms-of-service.html`, `shipping.html`, `returns.html`, branded `404.html`; rewire legal links | M | 7 |
| 10 | SEO + infra | `vercel.json` (cleanUrls, security headers, image caching), robots.txt, sitemap.xml, full favicon set, JSON-LD, canonicals | M | 9 |
| 11 | Accessibility + motion | `prefers-reduced-motion`, `:focus-visible`, skip link, gallery aspect-ratio lock, alt-text audit | S | 10 |
| 12 | Final QA sweep | Grep-based dead-link/console/typo sweep + full browser matrix before you call it done | S | 11 |

**Why this order:** 1–2 remove landmines first (renames are safest before any renderer work touches image paths). 3 builds the data layer everything else consumes — after it, the shop grid, marquee, and PDP can never drift apart again. 4–6 are pure UX wins on the existing pages. 7–9 fill the site's skeleton (every dead link from the audit dies in this stretch). 10–11 harden and polish. 12 proves it's done.

---

## 6. Antigravity prompts — copy-paste, one at a time

> Ground rules baked into every prompt: strict scope lock, numbered steps, verification greps, visual sanity check, commit but **never push** (you push via GitHub Desktop). If Antigravity reports a deviation, stop and re-read its report before pushing.

---

### PROMPT 1 of 12 — Typography foundation fix

```
Goal: The KXM site declares PP Neue Montreal and PP Editorial New via @font-face, but the OTF files were never deployed — the live site is silently rendering all UI text in Arial and display text in Instrument Serif. Fix typography permanently by switching the font stack to Google Fonts' Instrument Sans (primary sans) + Instrument Serif (display serif), removing every dead @font-face declaration, and normalizing line endings.

> Strict scope: Antigravity may ONLY modify index.html, shop.html, product.html, and may CREATE one new file: .gitattributes. Do NOT touch assets/js/cart.js, assets/css/cart.css, or any image. If you find yourself wanting to change anything else, STOP and report it as a follow-up suggestion instead.

=== STEP 0 — Inspect current state ===
In each of index.html, shop.html, product.html, locate and report:
- Every @font-face block (should be 10 per file: 4x Ppneuemontreal, 6x Ppeditorialnew)
- The :root token block (--font-primary, --font-display, --font-italic)
- The Google Fonts <link> for Instrument Serif
Report the counts before editing.

=== STEP 1 — Replace the Google Fonts link (all 3 files) ===
Replace the existing Instrument Serif-only stylesheet link with:
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
Keep the existing preconnect lines exactly as they are.

=== STEP 2 — Delete dead @font-face blocks (all 3 files) ===
Delete ALL @font-face blocks for 'Ppneuemontreal' and 'Ppeditorialnew' and the comment block above them ("Drop PP Neue Montreal & PP Editorial New files into assets/fonts/ when available"). Do not leave empty style gaps.

=== STEP 3 — Update the design tokens (all 3 files) ===
In each :root block, set exactly:
  --font-primary: 'Instrument Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-italic:  'Instrument Serif', Georgia, serif;
Leave every other token (--black, --white, --light-grey, --margin, --gutter, etc.) untouched.

=== STEP 4 — Line endings + .gitattributes ===
Convert index.html line endings from CRLF to LF (shop.html and product.html are already LF — verify, don't assume).
Create .gitattributes at repo root with exactly one line:
  * text=auto eol=lf

=== STEP 5 — Verify ===
Run:
  grep -rn "Ppneuemontreal\|Ppeditorialnew\|PPNeueMontreal\|PPEditorialNew" *.html
  # Must return zero results

  grep -rn "Instrument+Sans" *.html
  # Must return 3 results (one per page)

  git diff --stat
  # Must show ONLY: index.html, shop.html, product.html, .gitattributes

=== STEP 6 — Visual sanity check ===
Open index.html, shop.html, product.html in the browser. Verify:
- Body text, nav links, buttons, prices render in a grotesque sans (Instrument Sans), NOT Arial — check the lowercase 'a' and 't' shapes; Instrument Sans has a distinctive straight-cut 't'
- The 'kxm.' wordmark, italic brand quotes, and MORE THAN JUST FASHION still render in Instrument Serif exactly as before (no visual change expected there)
- No FOUT flash worse than before; no console errors
- Test one mobile breakpoint (DevTools 390px)

=== STEP 7 — Commit (do NOT push) ===
  git add index.html shop.html product.html .gitattributes
  git commit -m "fix: restore intended typography via Instrument Sans + Instrument Serif (PP fonts were never deployed)"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 8 — Final report ===
Report:
1. Count of @font-face blocks removed per file
2. The new :root font tokens per file
3. grep proof: zero PP references remain
4. Confirmation that CRLF was converted and .gitattributes created
5. Explicit confirmation that NO other file was modified (git diff --stat output attached)
```

**Browser check after deploy:** type feels tighter and more European across all pages; serif sections unchanged.

---

### PROMPT 2 of 12 — Image asset hygiene (rename + references)

```
Goal: Several image files have typos and spaces in their filenames ("Skill Bandana.png", "Woll Scarf.png", "product- 2a.png", "lookbook- 1.png", "collection-women a.png", "Hero Image.png", "KXM black text trans bg logo.png", etc.). They work only because browsers URL-encode spaces. Rename all of them to clean kebab-case and update every reference in the codebase so nothing breaks.

> Strict scope: Antigravity may ONLY rename files inside assets/ (git mv only, never delete+recreate), and edit string references in index.html, shop.html, product.html. May CREATE .editorconfig. Do NOT touch assets/js/cart.js logic or assets/css/cart.css. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Run: git ls-files assets/
Report the full list of image files found, so renames can be mapped against reality.

=== STEP 1 — Rename files (git mv, preserving history) ===
Apply this exact mapping (skip any file that does not exist locally, and note the skip in the final report):
  "assets/images/Skill Bandana.png"          -> assets/images/silk-bandana.png
  "assets/images/Woll Scarf.png"             -> assets/images/wool-scarf.png
  "assets/images/Noir Trench.png"            -> assets/images/noir-trench.png
  "assets/images/Canvas Tote.png"            -> assets/images/canvas-tote.png
  "assets/images/Leather Belt.png"           -> assets/images/leather-belt.png
  "assets/images/Linen Shirt.png"            -> assets/images/linen-shirt.png
  "assets/images/product- 2a.png"            -> assets/images/product-2a.png
  "assets/images/product- 3a.png"            -> assets/images/product-3a.png
  "assets/images/collection-women a.png"     -> assets/images/collection-women-a.png
  "assets/images/collection-accessories a.png" -> assets/images/collection-accessories-a.png
  "assets/images/lookbook- 1.png"            -> assets/images/lookbook-1.png
  "assets/images/Hero Image.png"             -> assets/images/hero-image.png
  "assets/KXM black text trans bg logo.png"  -> assets/images/kxm-logo-black.png
IMPORTANT: "assets/images/lookbook-1.png" must NOT already exist — if it does, report and stop instead of overwriting.

=== STEP 2 — Update every reference (all 3 HTML files) ===
Update ALL occurrences of the old paths (including inside the productsData object in product.html and the OG/twitter meta og:image / twitter:image tags in all 3 files). New OG image path: assets/images/hero-image.png. Search case-sensitively; old names may appear multiple times per file.

=== STEP 3 — Verify ===
Run:
  grep -rn "Skill Bandana\|Woll Scarf\|Noir Trench\|Canvas Tote\|Leather Belt\|Linen Shirt\|product- 2a\|product- 3a\|collection-women a\|collection-accessories a\|lookbook- 1\|Hero Image\|KXM black text" *.html
  # Must return zero results

  git status
  # Renames must appear as "renamed:" entries, not deleted+untracked

  git diff --stat
  # Must show ONLY the 3 HTML files (+ .editorconfig if created)

=== STEP 4 — Visual sanity check ===
Open index.html, shop.html, and product.html?id=leather-belt, product.html?id=silk-bandana, product.html?id=wool-scarf in the browser. Verify:
- Every image loads (DevTools Network tab: zero 404s)
- Homepage hero, marquee hover swaps, brand intro logo mark, and footer logo all render

=== STEP 5 — Commit (do NOT push) ===
  git add -A
  git commit -m "chore: rename image assets to clean kebab-case and update all references"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 6 — Final report ===
Report:
1. The exact rename table applied (old -> new), including any skipped files
2. grep proof: zero old-name references remain
3. git status proof: all changes are renames + 3 HTML files
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 3 of 12 — Single source of truth: products.js + real marquee links

```
Goal: Product data currently lives in two places (hardcoded markup in shop.html AND the productsData object in product.html), and the homepage marquee hardcodes a third copy with product cards that are dead ends (no <a>, no click handler). Create ONE shared data module — assets/js/products.js — and render the homepage marquee, the shop grid, and the product page from it. While rendering, make every product card a real link to its product page.

> Strict scope: Antigravity may ONLY modify index.html, shop.html, product.html, and may CREATE assets/js/products.js. Do NOT touch assets/css/cart.css or assets/js/cart.js. Do NOT change any visual styling, spacing, classes, or copy — the rendered DOM must be structurally identical to what exists today, with exactly one exception: marquee cards become <a> elements. If you find yourself wanting to restyle anything, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Read the productsData object in product.html and the hardcoded product cards in shop.html and index.html. Report: the 12 product ids, and confirm they match across files.

=== STEP 1 — Create assets/js/products.js ===
Move the existing productsData object VERBATIM into assets/js/products.js as:
  window.KXM_PRODUCTS = { ...exact same 12 entries, same fields, same values... };
Change nothing in the copy, prices, image paths, details, washCare, editorialImages, or completeTheLook arrays. Add exactly ONE new field per product, "category", using this mapping:
  obsidian-blazer: clothing      ivory-wide-leg: clothing     dusk-overcoat: clothing
  silence-dress: clothing        white-edition: clothing      noir-trench: clothing
  linen-shirt: clothing          archive-set: accessories     silk-bandana: accessories
  canvas-tote: accessories       wool-scarf: accessories      leather-belt: accessories
End the file with: window.KXM_PRODUCTS_READY = true;

=== STEP 2 — Wire the script into all 3 pages ===
In index.html, shop.html, product.html add BEFORE the existing inline <script> blocks (and before assets/js/cart.js):
  <script src="assets/js/products.js"></script>

=== STEP 3 — Refactor product.html ===
Delete the inline productsData object. Everywhere the old variable was used, reference window.KXM_PRODUCTS instead. The product lookup, URL param parsing/normalization, default fallback to "obsidian-blazer", title/meta populating, gallery, accordions, editorial strip, and complete-the-look logic must behave identically.

=== STEP 4 — Refactor shop.html ===
Replace the 12 hardcoded <a class="product-card"> blocks with an empty <div class="shop-grid" id="shopGrid"></div> container (keep the existing parent structure and section wrappers). Add a small inline script that renders all 12 products from window.KXM_PRODUCTS into it, generating markup IDENTICAL to today's card structure:
  <a href="product.html?id=PRODUCT_ID" class="product-card js-reveal">
    <div class="product-img-container"><img src="IMAGES[0]" alt="PRODUCT NAME" loading="lazy" /></div>
    <div class="product-info">
      <div class="product-info-row"><span class="product-name">NAME</span><span class="product-price">PRICE</span></div>
      <div class="product-hover-action">View Product</div>
    </div>
  </a>
Preserve the existing js-reveal stagger by cycling js-reveal-delay-1..5 exactly as the current markup does. Keep the title bar counts accurate: "(12)" must reflect the rendered count.

=== STEP 5 — Refactor index.html marquee + make cards real links ===
Replace the 12 hardcoded <article class="product-card"> marquee cards (original set + duplicate set) with an empty <div class="products-track" id="productsTrack"></div>. Render from window.KXM_PRODUCTS:
- Each card becomes: <a href="product.html?id=PRODUCT_ID" class="product-card" aria-label="PRODUCT NAME - PRICE">
- Inside, keep the exact existing inner structure: .product-card-img with a .default-img and (when images[1] exists) a .hover-img, then .product-card-info with name, price, and the &rarr; arrow. Products with only one image get only the default img.
- Render the original set, then render the same set again with aria-hidden="true" and empty alt attributes — exactly the seamless-loop pattern used today.
The marquee CSS (productsMarquee keyframes, hover pauses, hover-img opacity swap) must work unchanged.

=== STEP 6 — Verify ===
Run:
  grep -rn "productsData" *.html
  # Must return zero results

  grep -c "product-card" shop.html index.html
  # Counts should be small now (CSS + render function), NOT 12 hardcoded copies

  node -e "const w={};global.window=w;require('./assets/js/products.js');const k=w.KXM_PRODUCTS;console.log(Object.keys(k).length, k['silk-bandana'].images, k['leather-belt'].category)"
  # Must print: 12 and the renamed image paths and "accessories"

  git diff --stat
  # Must show ONLY: index.html, shop.html, product.html, assets/js/products.js

=== STEP 7 — Visual sanity check ===
Open all three pages. Verify:
- Homepage marquee: still scrolls infinitely, pauses on hover, hover swaps dual images where they exist, and clicking ANY card lands on the correct product.html?id=... (this is the critical new behavior)
- Shop grid: 12 cards, same look, reveal stagger intact, every card links correctly
- Product page: all 12 ids still load with correct images, sizes, accordions, complete-the-look; an invalid ?id= still falls back to obsidian-blazer
- Add-to-cart still works from a product page; cart drawer still opens with the item
- Zero console errors everywhere

=== STEP 8 — Commit (do NOT push) ===
  git add index.html shop.html product.html assets/js/products.js
  git commit -m "refactor: extract products into shared products.js; marquee, shop grid and PDP render from it; marquee cards now link to PDPs"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 9 — Final report ===
Report:
1. Confirmation that all 12 products + the category field are in products.js (list ids)
2. grep proof: zero productsData references remain
3. The one DOM change on the homepage (article -> a) and why
4. Explicit confirmation that NO styling, copy, or other file was modified
```

---

### PROMPT 4 of 12 — Homepage + metadata fixes

```
Goal: Fix the social-sharing metadata (OG/Twitter currently point to https://kxm.com/ — a domain this project does not own), correct dead hrefs in the menu overlay and footer on the homepage, and remove dead CSS that styles markup which does not exist.

> Strict scope: Antigravity may ONLY modify index.html, shop.html, product.html. Do NOT touch any other file. Do NOT alter visible design or copy. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
In all 3 files, report every occurrence of "kxm.com", every href="#" that is NOT a .js-cart-open or #newsletterForm anchor, and whether a .hero-slides markup block exists in index.html body (it should not — only its CSS does).

=== STEP 1 — Fix OG / Twitter metadata (all 3 files) ===
Replace every https://kxm.com/... URL with the real deployment origin https://kxm-by-divyaraj.vercel.app/ preserving the page path (/ for index, /shop.html for shop). Make og:image and twitter:image ABSOLUTE:
  https://kxm-by-divyaraj.vercel.app/assets/images/hero-image.png

=== STEP 2 — Fix dead hrefs on index.html ===
- Menu overlay link "Home": href="#" -> href="index.html"
- Footer "Site Index" link "Home": href="#" -> href="index.html"
- Content block 01 link: <a class="content-block-link">[Read our story]</a> -> href="about.html" (page arrives in a later phase; acceptable)
- Content block 02 link: <a class="content-block-link">[Our sourcing]</a> -> href="about.html#materials"
- Content block 04 link "[Book an appointment]": keep as-is (points to newsletter form)
Leave menu/footer "About Us", "Contact", and all Legal links exactly as they are — they get rewired in later phases when their pages exist. Apply the same "Home" href fix on shop.html and product.html menus/footers.

=== STEP 3 — Remove dead hero CSS on index.html ===
Delete the .hero-slides and .hero-slide-num CSS rules (the markup does not exist). Change nothing else in the stylesheet.

=== STEP 4 — Verify ===
Run:
  grep -rn "kxm.com" *.html
  # Must return zero results

  grep -rn 'href="#"' *.html
  # Remaining matches must ONLY be class="js-cart-open" links or the newsletter anchor

  grep -rn "hero-slides" index.html
  # Must return zero results

  git diff --stat
  # Must show ONLY the 3 HTML files

=== STEP 5 — Visual sanity check ===
Open all 3 pages. Verify: zero console errors; nav, menu overlay, footer, content-block links all behave; no layout shift anywhere. Paste one page's URL into https://www.opengraph.xyz or the WhatsApp compose box and confirm the preview shows the correct domain and hero image.

=== STEP 6 — Commit (do NOT push) ===
  git add index.html shop.html product.html
  git commit -m "fix: correct social meta to real domain, dead menu/footer hrefs, remove dead hero CSS"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 7 — Final report ===
Report:
1. Count of kxm.com references fixed per file
2. List of hrefs corrected
3. grep proofs from Step 4
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 5 of 12 — Shop page UX: filters, sort, hover previews, cart in nav

```
Goal: Upgrade the shop page from a flat 12-item grid to a lightly interactive collection view — category chips, price sorting, and dual-image hover previews — while fixing the nav inconsistency that hides the cart on shop and product pages. Everything is client-side and on-brand.

> Strict scope: Antigravity may ONLY modify shop.html, product.html, index.html, and assets/js/products.js (ONLY to read the pre-existing category field — do not alter product data values). May CREATE assets/js/shop.js. Do NOT touch assets/css/cart.css or assets/js/cart.js. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: current shop title bar markup, the nav-right markup on all 3 pages, and confirm window.KXM_PRODUCTS carries the category field for all 12 products.

=== STEP 1 — Cart + unified nav on shop and product pages ===
On shop.html and product.html, extend .nav-right so it contains BOTH:
  <a href="shop.html" class="nav-link-close-page">Close</a>
  <a href="#" class="nav-link-cart js-cart-open">Cart</a>
(cart.js already renders the #cartBadge count into .nav-link-cart automatically — verify after wiring by adding an item and checking the badge appears). On shop.html, replace the center toggle <a> (which currently just links home) with a real <button class="nav-menu-toggle"> two-line toggle, and add the same .menu-overlay + .menu-backdrop block used on product.html (links: Our Shop, Home, About Us, Contact; bottom row: My Cart, Join The Fam). Shop links inside the overlay point to shop.html, Home to index.html, About Us to index.html#brand-intro, Contact to #footer.

=== STEP 2 — Filter + sort UI on shop.html ===
Under the existing title bar, add a thin control row (new CSS, on-brand: 0.58rem uppercase, letter-spacing 0.1em, color var(--light-faded), active state black with 1px underline; row has 1px bottom border rgba(2,2,2,0.07), padding 1rem var(--margin)):
- Left: chips ALL (12) · CLOTHING (7) · ACCESSORIES (5) — counts computed from window.KXM_PRODUCTS, never hardcoded
- Right: SORT — FEATURED / PRICE LOW–HIGH / PRICE HIGH–LOW as three text toggles
Clicking a chip or sort re-renders #shopGrid from window.KXM_PRODUCTS. "Featured" = original object key order. Sort key: parse digits from the price string exactly like cart.js does (item.price.replace(/[^\d]/g,'')). Read URL param on load: shop.html?category=accessories pre-selects that chip.

=== STEP 3 — Hover preview images on shop cards ===
Update the shop renderer (and its CSS) so each .product-img-container holds a .default-img and, when product.images[1] exists, a .hover-img — same crossfade/scale behavior as the homepage marquee cards (opacity 0->1 on hover, transform scale(1.04), 0.6s cubic-bezier(0.25,0.46,0.45,0.94)). Single-image products show no hover swap and must not change appearance. This also applies to filter/sort re-renders.

=== STEP 4 — Editorial grid cells on index.html become links ===
- "Women's" cell -> <a href="shop.html"> wrapping the cell
- "Men's" cell -> <a href="shop.html">
- "Accessories" cell -> <a href="shop.html?category=accessories">
- "Portrait" cell: leave as-is (no destination yet)
- "Lookbook" cell: leave as-is (linked in a later phase)
Preserve the hover zoom CSS (cells are position:relative; the <a> wrapper must be display:block; height:100%; cursor:pointer).

=== STEP 5 — Verify ===
Run:
  node -e "const w={};global.window=w;require('./assets/js/products.js');const k=Object.values(w.KXM_PRODUCTS);console.log(k.filter(p=>p.category==='accessories').length, k.filter(p=>p.category==='clothing').length)"
  # Must print: 5 7

  grep -n "nav-link-cart" shop.html product.html
  # Must return 2 results (one per file)

  grep -rn "console\.log\|debugger" assets/js/shop.js *.html
  # Must return zero results

  git diff --stat
  # Must show ONLY: shop.html, product.html, index.html, assets/js/shop.js

=== STEP 6 — Visual sanity check ===
Open shop.html. Verify:
- Chips filter correctly; counts right; active chip is black/underlined; URL param works (shop.html?category=accessories)
- Sorting works both directions and "Featured" restores original order
- Hover preview works on dual-image products (Obsidian Blazer, Ivory Wide-Leg, Dusk Overcoat, Silence Dress, Archive Set, White Edition) and does nothing on single-image products (Leather Belt, etc.)
- Cart badge appears in nav after adding an item, on BOTH shop and product pages
- The menu overlay opens/closes on shop.html; backdrop click closes; Escape closes
- Index editorial cells link correctly; hover zoom still works
- Mobile 390px: control row wraps gracefully, grid stays 2 columns

=== STEP 7 — Commit (do NOT push) ===
  git add shop.html product.html index.html assets/js/shop.js
  git commit -m "feat: shop filtering, sorting, hover previews, cart access in nav, unified menu overlay"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 8 — Final report ===
Report:
1. Filter/sort behavior summary + chip counts
2. Which products got hover previews (6) and which did not (6, single image)
3. grep proofs from Step 5
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 6 of 12 — Product page UX: size enforcement, size guide, breadcrumb

```
Goal: Bring the product detail page to luxury-retail standard: require an explicit size choice before adding to cart, add an on-brand size guide modal, add a breadcrumb back to shop, and sync the meta description to the active product.

> Strict scope: Antigravity may ONLY modify product.html. Do NOT touch any other file. Keep ALL existing styling patterns (same fonts, spacing values, 0.58rem uppercase labels, 1px borders). If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: current size-row markup (note the pre-selected "selected" class on M), the add-to-cart handler, and the static meta description tag.

=== STEP 1 — Enforce size selection ===
For products with hasSizes: true:
- Remove the pre-selected M (no .size-btn starts selected)
- ADD TO CART starts disabled: text reads "SELECT A SIZE", opacity 0.35, cursor not-allowed
- First size click enables the button: text becomes "ADD TO CART", full opacity; clicking another size keeps it enabled
- Clicking ADD TO CART while disabled must do nothing
For hasSizes: false products (Archive Set, Silk Bandana, Canvas Tote, Wool Scarf, Leather Belt): button always reads "ADD TO CART" and is always enabled. Keep the existing "ADDED" confirmation flash.

=== STEP 2 — Size guide modal ===
Next to the "SELECT SIZE" label, right-aligned, add:
  <button class="size-guide-trigger" type="button">SIZE GUIDE +</button>
 Styled like other 0.58rem uppercase faded labels; hover turns black. Clicking opens an on-brand modal: fixed overlay rgba(2,2,2,0.25) + backdrop blur(1px), white panel max-width 420px, 1px border rgba(2,2,2,0.06), padding ~2rem, close "CLOSE" text button top-right (same style as cart-close-btn). Content: title "Size Guide" in var(--font-display) italic, then a minimal table — rows XS/S/M/L/XL, columns CHEST · WAIST · HIP (cm): XS 84-88 / 66-70 / 92-96, S 88-92 / 70-74 / 96-100, M 92-96 / 74-78 / 100-104, L 96-102 / 78-84 / 104-110, XL 102-108 / 84-90 / 110-116. Table type: 0.65rem uppercase, light grey row separators. Footnote: "Measurements in centimetres. Garment is cut for a relaxed fit." Close on backdrop click and Escape. Hide the trigger entirely on hasSizes:false products.

=== STEP 3 — Breadcrumb ===
Above the product title row add:
  <nav class="breadcrumb" aria-label="Breadcrumb">SHOP &nbsp;/&nbsp; <span id="breadcrumbCategory"></span> &nbsp;/&nbsp; <span id="breadcrumbName"></span></nav>
Style: 0.58rem uppercase, letter-spacing 0.1em, color var(--light-faded), the product name in black. "SHOP" links to shop.html. Category text = product.category uppercase. Margin-bottom ~1.5rem.

=== STEP 4 — Dynamic meta description ===
When a product loads, update: document.querySelector('meta[name="description"]').setAttribute('content', product.description);

=== STEP 5 — Verify ===
Run:
  grep -n "size-guide-trigger\|breadcrumb" product.html
  # Must return results for trigger, breadcrumb markup and CSS

  grep -rn "console\.log\|debugger" product.html
  # Must return zero results

  git diff --stat
  # Must show ONLY product.html

=== STEP 6 — Visual sanity check ===
Open product.html?id=obsidian-blazer. Verify:
- ADD TO CART reads "SELECT A SIZE" and is inert until a size is clicked; picking L then adding works; cart drawer shows "Size: L"
- SIZE GUIDE opens/closes (button, backdrop, Escape); table renders cleanly; trigger hidden on product.html?id=leather-belt
- Breadcrumb shows SHOP / CLOTHING / OBSIDIAN BLAZER and SHOP links back
- View page source after load: meta description matches the product copy
- No layout shift when switching between hasSizes and non-size products
- Mobile 390px: modal fits viewport, breadcrumb wraps if needed

=== STEP 7 — Commit (do NOT push) ===
  git add product.html
  git commit -m "feat: enforce size selection, add size guide modal, breadcrumb and dynamic meta on PDP"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 8 — Final report ===
Report:
1. Size-enforcement behavior summary
2. Size guide modal details
3. grep proofs from Step 5
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 7 of 12 — New pages: about.html + lookbook.html

```
Goal: Two of the site's dead ends are "About Us" and the editorial/Lookbook grid. Build about.html and lookbook.html inside the existing design system, then rewire every About/Lookbook link across the site. Reuse existing copy and images only — do not invent new brand history, metrics, or facilities.

> Strict scope: Antigravity may CREATE about.html and lookbook.html, and may modify index.html, shop.html, product.html (link rewiring + the two new pages' nav/footer markup must be copied verbatim from existing pages). Do NOT modify assets/js/products.js, assets/js/cart.js, assets/css/cart.css. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: the exact nav / menu overlay / cart drawer / checkout modal / footer markup blocks from index.html (these get copied into the new pages), and the list of lookbook/editorial images available in assets/images/ (lookbook-1.png, lookbook-1aa.png, lookbook-2.png, collection-men.png, collection-women.png, collection-accessories.png, about-editorial.png, hero-image.png).

=== STEP 1 — Build about.html ===
Structure (all styling inline in <head>, reusing the same tokens and patterns as index.html — do not restyle anything, just reuse):
- Same <head> pattern: charset, viewport, favicon, cart.css, full meta description + OG/Twitter tags pointing at https://kxm-by-divyaraj.vercel.app/about.html with og:image https://kxm-by-divyaraj.vercel.app/assets/images/hero-image.png, Google Fonts links (Instrument Sans + Instrument Serif), title "KXM — About"
- Full-bleed hero: about-editorial.png with dark gradient overlay, bottom-left serif italic headline "The house behind the cloth." (style: same as .lifestyle-script)
- Manifesto section (black background): reuse the existing stmt-headline styling, text "MORE THAN JUST FASHION" (same as homepage — it is the brand manifesto, deliberate repetition is fine)
- Story section titled "The KXM Ethos": reuse the EXACT existing brand-statement quote ("Sourced from heritage mills in Italy and Japan... made to endure.")
- Four numbered blocks mirroring index.html content blocks (01 The Origin / 02 Materials / 03 Collection / 04 Flagship) — reuse the EXACT existing copy for each, expanded into readable stacked sections (label + italic title + body text). Give block 02 the id="materials" so about.html#materials anchors correctly. Block links: [Shop the collection] -> shop.html, [View the lookbook] -> lookbook.html
- Footer + menu overlay + cart drawer + checkout modal + cart.js + products.js: copied verbatim from index.html
- Nav state: about.html is a white page — nav must use the light (black text) styling from shop.html

=== STEP 2 — Build lookbook.html ===
- Same head/footer/nav pattern; title "KXM — Lookbook"; meta description: "The KXM lookbook — editorial imagery from the first collection."
- Top bar styled like shop.html title bar: left "KXM. FASHION / EDITORIAL", right "(SEASON 01)"
- Editorial grid: full-bleed 2-column image grid (1px gap, images ~4:5, object-fit cover, subtle hover scale(1.03) like .ed-cell) using: lookbook-1aa.png ("White Edition — Women's"), collection-men.png ("Men's — Tailoring"), lookbook-2.png ("Dark studies"), collection-women.png ("The Silence Dress"), collection-accessories.png ("Objects & Accessories"), about-editorial.png ("Portrait"). Caption style = existing .ed-cell-label. Each image links to shop.html (Accessories image -> shop.html?category=accessories)
- Closing band: black background, serif italic line "Worn by people, not mannequins." + [ SHOP THE COLLECTION ] link to shop.html
- Footer/menu/cart blocks copied verbatim; light nav styling

=== STEP 3 — Rewire links across existing pages ===
On index.html, shop.html, product.html:
- Menu overlay "About Us" -> about.html
- Footer "About Us" -> about.html
- index.html editorial "Lookbook" cell + the "Lookbook" section label link -> lookbook.html
- index.html menu overlay has no Lookbook entry; ADD one: <a href="lookbook.html" class="menu-link">Lookbook</a> between About Us and Contact (apply to all 3 pages' overlays so menus match)

=== STEP 4 — Verify ===
Run:
  grep -rn "about.html" *.html
  # Must return matches on all pages (menus + footers + content links)

  grep -rn "lookbook.html" *.html
  # Must return matches on all pages (menus + cells)

  grep -rn "href=\"#\" " about.html lookbook.html
  # Must return zero results (no dead links on new pages)

  git diff --stat
  # Must show ONLY: about.html (new), lookbook.html (new), index.html, shop.html, product.html

=== STEP 5 — Visual sanity check ===
Open about.html and lookbook.html. Verify:
- Nav, menu overlay, cart drawer, checkout modal, footer all behave exactly like the homepage
- Cart badge persists across pages (localStorage is shared)
- All images load; hover zooms work; every link resolves (click through ALL of them)
- about.html#materials lands on the materials block
- Mobile 390px: grids stack to 1 column, hero text scales

=== STEP 6 — Commit (do NOT push) ===
  git add about.html lookbook.html index.html shop.html product.html
  git commit -m "feat: add about.html and lookbook.html; rewire About/Lookbook links sitewide"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 7 — Final report ===
Report:
1. Sections built on each new page
2. Links rewired per file
3. grep proofs from Step 4
4. Explicit confirmation that NO other file was modified and NO new copy was invented beyond the glue lines specified
```

---

### PROMPT 8 of 12 — New page: contact.html + real form backend (Formspree)

```
Goal: Give the brand a real contact page and make the two existing forms actually send data — the new contact form AND the footer newsletter — using Formspree, with the same honeypot + debounce + accessible status pattern used on production work. NOTE: Antigravity must pause at STEP 1 and ask the user for their Formspree endpoint URL before continuing.

> Strict scope: Antigravity may CREATE contact.html, and may modify index.html, shop.html, product.html, about.html, lookbook.html (Contact link rewiring + newsletter form wiring). Do NOT touch assets/js/products.js, assets/js/cart.js, assets/css/cart.css, or any vercel config. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: the footer newsletter form markup on index.html (newsletterForm), and every "Contact" link across pages (menu overlays + footers).

=== STEP 1 — PAUSE AND ASK ===
Antigravity MUST stop here and ask the user: "What is your Formspree endpoint URL? (looks like https://formspree.io/f/xxxxxxxx). Create the form at formspree.io named 'KXM — Contact & List' if you haven't yet." Do not proceed until a URL is provided. If the user says to use a placeholder, use https://formspree.io/f/XXXXXXXX and note in the final report that it must be replaced before the forms work.

=== STEP 2 — Build contact.html ===
- Same head/nav/menu/cart/footer pattern as about.html (light nav). Title "KXM — Contact". Meta description: "Contact KXM — enquiries, appointments and the mailing list." OG tags with the live domain, og:image hero-image.png
- Layout: two columns (stack on mobile, min-height ~70vh)
  LEFT: serif italic headline "By appointment, by design." + intro line "For enquiries, appointments, and everything else — write to us." + contact rows styled like footer links: EMAIL divyarajc2@gmail.com (mailto), PHONE +91 99797 87087 (tel), INSTAGRAM @divyaraj.creates (https://www.instagram.com/divyaraj.creates)
  RIGHT: form (id="contactForm", novalidate) with fields NAME, EMAIL, MESSAGE (textarea, rows=5) — same underline-only input styling as the footer newsletter (border-bottom 1px rgba(2,2,2,0.18), uppercase 0.68rem inputs). Hidden honeypot field: name="company_website" positioned off-screen (aria-hidden, tabindex="-1"). Hidden Formspree config fields: _subject "KXM — Website Enquiry", _template "table", _captcha "false". Submit button styled like .form-submit ("SEND ENQUIRY")
- Submit behavior (vanilla JS inline): prevent default -> honeypot filled? silently return -> 2-second debounce guard -> validate name non-empty + email regex -> disable button + text "SENDING..." + aria-busy="true" -> fetch() POST to the Formspree endpoint with Accept: application/json, URL-encoded body -> on 200: hide fields, show success box "Received. We'll be in touch." (role="status", aria-live="polite", same style as newsletterSuccess) -> on error: show inline error box "Something went wrong. Email us directly at divyarajc2@gmail.com." (role="alert") -> network failure gets its own distinct message
- Footer + menu overlay + cart blocks copied verbatim

=== STEP 3 — Wire the newsletter for real (all pages with the footer form: index.html, about.html, lookbook.html, contact.html if footer present there too) ===
Keep the exact same visual behavior (validate -> fade fields -> success message). Add: fetch() POST of {NAME: name, EMAIL: email, _subject: "KXM — Mailing List Signup", _template: "table", _captcha: "false"} to the SAME Formspree endpoint. On failure, still show the success message (silent fail is acceptable for a mailing list) but log to console.error only — never alert(). Honeypot check first: a hidden input name="company_website" inside the newsletter form; if filled, skip the fetch silently.

=== STEP 4 — Rewire Contact links ===
On ALL pages (index, shop, product, about, lookbook): menu overlay "Contact" -> contact.html; footer "Contact Us" -> contact.html.

=== STEP 5 — Verify ===
Run:
  grep -rn "contact.html" *.html
  # Must return matches on all pages

  grep -n "formspree.io/f/" contact.html
  # Must return the endpoint in the fetch call (or XXXXXXXX placeholder)

  grep -rn "console\.log\|debugger" contact.html
  # Must return zero results

  git diff --stat
  # Must show ONLY: contact.html (new) + the pages touched in steps 3-4

=== STEP 6 — Visual sanity check ===
Open contact.html. Verify: layout matches brand; submit with empty fields shows error states; honeypot present in DOM but invisible; a REAL test submission arrives in the Formspree inbox (user checks formspree.io dashboard); success/error boxes announce correctly. Then submit one newsletter signup from index.html footer and confirm it arrives too. Mobile 390px: columns stack, form fills width.

=== STEP 7 — Commit (do NOT push) ===
  git add contact.html index.html shop.html product.html about.html lookbook.html
  git commit -m "feat: add contact.html and wire contact + newsletter forms to Formspree"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 8 — Final report ===
Report:
1. The Formspree endpoint used (or that a placeholder needs replacing)
2. Form behaviors implemented (honeypot, debounce, statuses)
3. Links rewired per file
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 9 of 12 — Legal pages + branded 404

```
Goal: Kill the four dead legal links and the ugly default Vercel 404. Build four compact legal pages and one on-brand 404 page in the KXM design system, then rewire every legal link sitewide. KXM is a fictional demo brand — the legal copy below is intentionally generic; do not invent company registration numbers, addresses, or jurisdictions beyond what is written here.

> Strict scope: Antigravity may CREATE privacy-policy.html, terms-of-service.html, shipping.html, returns.html, 404.html, and may modify index.html, shop.html, product.html, about.html, lookbook.html, contact.html (legal link rewiring only). Do NOT touch any assets/ file. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: every Legal footer link occurrence across pages (each has href="#" today).

=== STEP 1 — Shared page template ===
All five new pages reuse the standard head/nav/menu/cart/footer pattern from about.html (light nav). Legal pages get: title bar like shop.html ("PRIVACY POLICY" etc. on the left, "LEGAL" centered, "(KXM)" right), then a single readable column max-width 640px, padding 5rem var(--margin), body text 0.72rem/1.7 rgba(2,2,2,0.5), section headings in var(--font-display) italic 1.1rem black, margins 2rem between sections. 404.html is different — see STEP 6.

=== STEP 2 — privacy-policy.html ===
Title "KXM — Privacy Policy". Sections (short, on-voice): 1. What we collect (name, email, messages you send us). 2. How we use it (to respond to enquiries and send the mailing list you asked for). 3. What we never do (sell or rent your data). 4. Cookies & local storage (the site stores your cart in your browser's local storage; it never leaves your device). 5. Third parties (Formspree processes form submissions on our behalf). 6. Your rights (email divyarajc2@gmail.com to access or delete your data). 7. Contact. 8. Changes to this policy.

=== STEP 3 — terms-of-service.html ===
Title "KXM — Terms of Service". Sections: 1. About this site (KXM is a demonstration brand; this website is a portfolio showcase). 2. No purchases are processed (the checkout is a demonstration and completes no transaction, charges no payment method, and ships no goods). 3. Intellectual property (site design and imagery belong to their creators; reference imagery belongs to its original owners). 4. Acceptable use. 5. Limitation of liability. 6. Contact.

=== STEP 4 — shipping.html ===
Title "KXM — Shipping". Sections: 1. Shipping policy (orders are dispatched within 2 business days; domestic delivery 5–7 business days; international 10–15 business days). 2. Complimentary shipping on orders over ₹15,000. 3. Tracking (emailed when your order ships). 4. Note line: "KXM is a demonstration brand — this policy is shown for reference."

=== STEP 5 — returns.html ===
Title "KXM — Returns". Sections: 1. Returns window (14 days from delivery, unworn, tags attached). 2. How to start a return (email divyarajc2@gmail.com with your order details). 3. Refunds (issued to the original payment method within 7 business days of the return arriving). 4. Exchanges (subject to availability). 5. Note line: "KXM is a demonstration brand — this policy is shown for reference."

=== STEP 6 — 404.html ===
Minimal black canvas (background #020202, white text), nav in white (fixed, as on the homepage). Centered stack: giant "404" in var(--font-display) at clamp(6rem, 20vw, 16rem) weight 800, line-height 0.9; beneath it, serif italic 1.1rem line "This piece has been archived."; beneath that, an underlined uppercase 0.68rem link [ RETURN HOME ] to index.html and a second link [ SHOP THE COLLECTION ] to shop.html with 1rem gap. No footer, no cart drawer. Set <title>KXM — 404</title> and a meta description "Page not found."

=== STEP 7 — Rewire legal links sitewide ===
On ALL six existing pages, footer Legal column: Privacy Policy -> privacy-policy.html, Refunds -> returns.html, Shipping -> shipping.html, Terms of Service -> terms-of-service.html.

=== STEP 8 — Verify ===
Run:
  grep -rn 'href="#">Privacy\|href="#">Refunds\|href="#">Shipping\|href="#">Terms' *.html
  # Must return zero results

  grep -c "privacy-policy.html" index.html
  # Must be >= 1 (same check for the other legal pages)

  git diff --stat
  # Must show ONLY the 5 new pages + the 6 rewired pages

=== STEP 9 — Visual sanity check ===
Open each new page: template consistent, links resolve, mobile 390px readable. Then open https://kxm-by-divyaraj.vercel.app/this-page-does-not-exist AFTER pushing and deploying — confirm the branded 404 appears instead of the bare NOT_FOUND.

=== STEP 10 — Commit (do NOT push) ===
  git add privacy-policy.html terms-of-service.html shipping.html returns.html 404.html index.html shop.html product.html about.html lookbook.html contact.html
  git commit -m "feat: add privacy, terms, shipping, returns pages and branded 404; rewire legal links"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 11 — Final report ===
Report:
1. Pages created and their section counts
2. Links rewired per file
3. grep proofs from Step 8
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 10 of 12 — SEO + infrastructure (vercel.json, robots, sitemap, favicons, JSON-LD)

```
Goal: Add the deployment-grade infrastructure layer: clean URLs, security headers, image caching, robots.txt, sitemap.xml, a full favicon set, canonical tags, and JSON-LD structured data. Follow the vercel.json schema rules exactly — permanent:true and statusCode:308 are MUTUALLY EXCLUSIVE and must never appear on the same route.

> Strict scope: Antigravity may CREATE vercel.json, robots.txt, sitemap.xml, and favicon/ (generated icon set + site.webmanifest + browserconfig.xml), and may modify all 9 existing HTML files (canonical + favicon links + JSON-LD + PDP product schema only). Do NOT touch assets/js/*.js logic or assets/css/*.css. If anything else needs changing, STOP and report it instead.

=== STEP 0 — Inspect current state ===
Report: whether vercel.json exists (it must not — creating a second one would be a red flag), current favicon link tags, and the list of all HTML files.

=== STEP 1 — vercel.json ===
Create with exactly this structure (no redirects are needed — cleanUrls handles .html stripping):
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self' https://formspree.io; frame-ancestors 'self'; form-action 'self' https://formspree.io; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    },
    {
      "source": "/assets/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
Double-check the JSON parses (node -e "JSON.parse(require('fs').readFileSync('vercel.json'))" must succeed). REMINDER: do NOT add both permanent and statusCode anywhere.

=== STEP 2 — robots.txt ===
User-agent: *
Allow: /
Sitemap: https://kxm-by-divyaraj.vercel.app/sitemap.xml

=== STEP 3 — sitemap.xml ===
Standard sitemap listing (all with https://kxm-by-divyaraj.vercel.app/ prefix, NO .html extensions, lastmod = today): /, /about, /contact, /lookbook, /shop, /privacy-policy, /terms-of-service, /shipping, /returns.

=== STEP 4 — Favicon set ===
Generate from the existing assets/images/favicon.png into favicon/: favicon.ico, favicon-16x16.png, favicon-32x32.png, favicon-96x96.png, apple-touch-icon.png (180x180), icon-192.png, icon-512.png, site.webmanifest, browserconfig.xml. On every HTML page, replace the single favicon <link> with the full set of icon links + <link rel="manifest" href="/favicon/site.webmanifest"> + theme-color #ffffff. If a required size cannot be generated locally, ship what is possible and note it.

=== STEP 5 — Canonical tags + titles audit ===
On every page add <link rel="canonical" href="https://kxm-by-divyaraj.vercel.app/<clean-url>"> using the cleanUrls form (/shop not /shop.html). Verify every page has a unique, descriptive <title> and meta description; fix duplicates if found.

=== STEP 6 — JSON-LD ===
- index.html: Organization (name "KXM", url https://kxm-by-divyaraj.vercel.app, logo https://kxm-by-divyaraj.vercel.app/assets/images/kxm-logo-black.png) + WebSite (same url)
- shop.html: ItemList listing the 12 products (name + url product.html?id=...)
- product.html: inside the existing dynamic script, inject a <script type="application/ld+json"> Product schema per active product: name, image (absolute URL), description, brand "KXM", offers { price: numeric value parsed from the price string, priceCurrency: "INR", availability: "https://schema.org/InStock" }

=== STEP 7 — Verify ===
Run:
  node -e "JSON.parse(require('fs').readFileSync('vercel.json'));console.log('vercel.json OK')"
  # Must print: vercel.json OK

  grep -rn "permanent" vercel.json
  # Must return zero results (schema-rule safety)

  grep -c "rel=\"canonical\"" *.html
  # Must be >= 1 on every page

  git diff --stat
  # Must show ONLY: vercel.json, robots.txt, sitemap.xml, favicon/, and the HTML files

=== STEP 8 — Visual sanity check ===
After the user pushes and Vercel redeploys (wait ~60s):
- https://kxm-by-divyaraj.vercel.app/shop serves without .html and returns 200
- Response headers include the CSP and the other 6 headers (PowerShell: $r = Invoke-WebRequest -Uri "https://kxm-by-divyaraj.vercel.app/" -Method Head -UseBasicParsing; $r.Headers)
- /favicon/site.webmanifest returns 200
- Google Rich Results Test or view-source confirms JSON-LD parses (no console errors)
- IMPORTANT: after deploy, click through every page once — a CSP mistake silently breaks scripts; if anything stops working, the CSP script-src is the first suspect

=== STEP 9 — Commit (do NOT push) ===
  git add vercel.json robots.txt sitemap.xml favicon/ index.html shop.html product.html about.html lookbook.html contact.html privacy-policy.html terms-of-service.html shipping.html returns.html 404.html
  git commit -m "feat: add vercel.json (cleanUrls, security headers, image caching), robots, sitemap, favicon set, canonicals and JSON-LD"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 10 — Final report ===
Report:
1. vercel.json parse confirmation + header list
2. Favicon files generated
3. Canonical + JSON-LD coverage per page
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 11 of 12 — Accessibility + motion polish

```
Goal: Make the site feel as considered as it looks: respect prefers-reduced-motion, add visible keyboard focus states and a skip link, lock the product gallery aspect ratio (kills the grey-band look on short images), and audit alt text.

> Strict scope: Antigravity may ONLY modify the 9 existing HTML files and assets/css/cart.css (focus styles for cart controls only if needed). Do NOT touch assets/js/*.js logic. If anything else needs changing, STOP and report it instead.

=== STEP 1 — prefers-reduced-motion (all pages) ===
Add one shared media block:
  @media (prefers-reduced-motion: reduce) {
    .products-track { animation: none; }
    .js-reveal { opacity: 1; transform: none; transition: none; }
    * { scroll-behavior: auto !important; }
  }
On index.html additionally guard the hero parallax: in the scroll handler, return early if window.matchMedia('(prefers-reduced-motion: reduce)').matches.

=== STEP 2 — Focus states (all pages) ===
Add:
  :focus-visible { outline: 1px solid var(--black); outline-offset: 3px; }
  #nav :focus-visible, .menu-overlay :focus-visible { outline-color: currentColor; }
Ensure interactive elements (links, buttons, size buttons, chips, accordion headers, qty buttons) receive visible focus.

=== STEP 3 — Skip link (all pages) ===
As the first element inside <body>:
  <a href="#main" class="skip-link">Skip to content</a>
Style: position absolute, top -40px, left var(--margin), background var(--black), color var(--white), padding 0.6rem 1rem, font 0.65rem uppercase, z-index 400, transition top 0.2s; on :focus, top: var(--margin). Add id="main" to each page's primary content wrapper (main or first section).

=== STEP 4 — Gallery aspect-ratio lock (product.html) ===
.main-image-display { aspect-ratio: 4 / 5; background: var(--light-grey); }
.main-image-display img { width: 100%; height: 100%; object-fit: cover; }
Thumbnail cards get aspect-ratio: 4 / 5 as well. No other gallery behavior changes.

=== STEP 5 — Alt text audit ===
List every <img> across pages with an empty or generic alt (e.g. alt="KXM Collection"). Replace generic ones with specific descriptions ("Model wearing the White Edition utility jacket", "Green leather tote with silk scarf", etc.). Do not touch the aria-hidden marquee duplicates (they keep empty alts).

=== STEP 6 — Verify ===
Run:
  grep -rn "prefers-reduced-motion" *.html
  # Must return >= 1 match per page

  grep -rn "skip-link" *.html
  # Must return >= 1 match per page

  grep -rn "alt=\"KXM Collection\"" *.html
  # Must return zero results

  git diff --stat
  # Must show ONLY HTML files (+ cart.css if focus styles required it)

=== STEP 7 — Visual sanity check ===
Keyboard-only pass on every page: Tab through nav -> skip link appears -> content -> menu overlay -> cart drawer -> footer; focus is always visible. Toggle DevTools rendering > prefers-reduced-motion: reduce -> marquee stops, reveals appear instantly, parallax off. Open product.html?id=ivory-wide-leg: gallery shows no grey bands at any image. Screen-reader smoke test optional (Windows Narrator): skip link and form statuses announce.

=== STEP 8 — Commit (do NOT push) ===
  git add -A
  git commit -m "fix: accessibility and motion polish (reduced motion, focus states, skip links, gallery aspect ratio, alt text)"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 9 — Final report ===
Report:
1. Which motion behaviors are now reduced-motion aware
2. Alt texts rewritten (count + examples)
3. grep proofs from Step 6
4. Explicit confirmation that NO other file was modified
```

---

### PROMPT 12 of 12 — Final QA sweep (pre-handoff)

```
Goal: Prove the site is done. Run the full static-analysis sweep, compile the change ledger, and hand the user a browser-matrix checklist. Make NO code changes unless a check fails — a failed check gets fixed, re-verified, and noted.

> Strict scope: Antigravity may modify any project file ONLY to fix a failure discovered below. Every fix must be re-run through the failing check until it passes.

=== STEP 1 — Dead-reference sweep (all must return ZERO) ===
  grep -rn "Ppneuemontreal\|Ppeditorialnew\|PPNeueMontreal\|PPEditorialNew" *.html
  grep -rn "kxm.com" *.html
  grep -rn "Skill Bandana\|Woll Scarf\|product- 2a\|product- 3a\|lookbook- 1\|collection-women a\|collection-accessories a\|Hero Image\|KXM black text" *.html
  grep -rn "productsData" *.html
  grep -rn "console\.log\|debugger" *.html assets/js/*.js
  grep -rn "href=\"#\"" *.html
    # exception list: js-cart-open links and #newsletterForm anchors only — anything else is a failure

=== STEP 2 — Coverage sweep (all must PASS) ===
  grep -c "Instrument+Sans" *.html                # >= 1 each
  grep -c "rel=\"canonical\"" *.html              # >= 1 each
  grep -c "skip-link" *.html                      # >= 1 each
  grep -n "nav-link-cart" shop.html product.html  # present
  grep -n "formspree.io/f/" contact.html          # present
  node -e "JSON.parse(require('fs').readFileSync('vercel.json'));console.log('OK')"

=== STEP 3 — Link inventory ===
Extract every internal href from every page (grep -oh 'href="[^"]*"' *.html | sort -u). Verify each target file exists (about.html, lookbook.html, contact.html, shop.html, product.html, index.html, privacy-policy.html, terms-of-service.html, shipping.html, returns.html, 404.html). Report the full inventory as proof.

=== STEP 4 — Change ledger ===
Run: git log --oneline (list all commits from this effort) and git diff --stat <first-commit>^..HEAD. Include both outputs in the final report.

=== STEP 5 — Commit (only if fixes were needed) ===
  git add -A
  git commit -m "chore: final QA sweep fixes"

Do NOT push. The user will push via GitHub Desktop.

=== STEP 6 — Final report ===
Output: 1) every grep result, 2) the link inventory, 3) the commit ledger, 4) the browser matrix below marked as "ready for user verification", 5) any known limitations (e.g. Formspree placeholder, favicon sizes skipped).
```

---

## 7. Your browser matrix (final verification — 20 minutes)

After Prompt 12's commit is pushed and deployed, walk this grid. Every cell is a click, not a project.

| Check | Desktop | Mobile 390px |
|---|---|---|
| Home: hero, marquee scrolls + every card CLICKS THROUGH to its product | ☐ | ☐ |
| Home: menu overlay, editorial cells, footer links all resolve | ☐ | ☐ |
| Shop: chips filter, sort works, hover previews, cart badge in nav | ☐ | ☐ |
| Product: size enforcement, size guide modal, breadcrumb, gallery no grey bands | ☐ | ☐ |
| Cart: add → qty + / − → remove → subtotal correct → checkout modal shows | ☐ | ☐ |
| About + Lookbook: load, images, links back | ☐ | ☐ |
| Contact: real submission lands in Formspree inbox | ☐ | ☐ |
| Newsletter: real signup lands in Formspree inbox | ☐ | ☐ |
| Legal pages: all four load from footer | ☐ | ☐ |
| Type any bad URL → branded 404 | ☐ | — |
| /shop serves clean (no .html) | ☐ | — |
| WhatsApp/LinkedIn share of homepage → correct preview | ☐ | — |
| Fonts: sans is Instrument Sans (not Arial), serif unchanged | ☐ | ☐ |
| Zero console errors on every page | ☐ | ☐ |

---

## 8. What NOT to do later (guardrails for future sessions)

1. **Never re-add the PP font files** without a Pangram Pangram web license — the Instrument Sans system is the permanent solution, not a stopgap.
2. **Never let a future edit reintroduce `--font-primary: Arial`** — that was the original bug.
3. **Never combine `permanent: true` with `statusCode: 308`** in vercel.json — it silently kills deployments (learned the hard way on 8Bit).
4. **Never push from PowerShell** — GitHub Desktop only.
5. **Never let product data reappear as inline copies** — all product changes go into `assets/js/products.js` only.
6. **Never remove the demo-checkout modal** — it is intentional portfolio lead-gen for Divyaraj Creates.
7. If a client ever wants this design for a real store, the migration path is: real PP fonts under license (or keep Instrument Sans), Shopify headless or Snipcart/Lemon Squeezy for payments, and the 12-prompt foundation here carries over almost 1:1.

---

*Audit + strategy + prompts built September 19, 2026, from live-site probing, the three uploaded page sources, three full-page screenshots, and the shared project memory from the 8Bit Creatives engagement.*

