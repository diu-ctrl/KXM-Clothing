// KXM K2 gate suite — run `node test_k2.js` from the repo root.
// PASS/FAIL/SKIP semantics. RESULT must show FAIL 0 and zero SKIP lines before deploy.
const fs = require('fs');
const crypto = require('crypto');
let pass = 0, fail = 0, skip = 0;
const failures = [];
function gate(id, label, fn) {
  try {
    const r = fn();
    if (r === 'SKIP') { skip++; console.log(`SKIP  ${id}  ${label}`); return; }
    if (r) { pass++; console.log(`PASS  ${id}  ${label}`); }
    else { fail++; failures.push(id); console.log(`FAIL  ${id}  ${label}`); }
  } catch (e) { fail++; failures.push(id); console.log(`FAIL  ${id}  ${label} :: ${String(e).slice(0, 120)}`); }
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const rd = f => fs.readFileSync(f).toString();

function captureRenderGrid() {
  const cap = { html: null };
  const stub = { set innerHTML(v) { cap.html = v; }, get innerHTML() { return cap.html || ''; },
                 querySelectorAll: () => [] };
  globalThis.window = globalThis;
  globalThis.location = { search: '' };
  globalThis.IntersectionObserver = function () { this.observe = () => {}; this.unobserve = () => {}; };
  globalThis.document = {
    getElementById: id => (id === 'shopGrid' ? stub : null),
    querySelector: () => ({ textContent: '' }),
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: { classList: { add(){}, remove(){}, contains: () => false, toggle(){} } },
  };
  eval(rd('assets/js/products.js'));
  eval(rd('assets/js/shop.js'));
  if (!cap.html) throw new Error('renderGrid produced no output');
  return cap.html;
}
const gridOf = h => {
  const m = h.match(/<div class="shop-grid" id="shopGrid">([\s\S]*?)<\/div>\s*<\/main>/);
  if (!m) throw new Error('shopGrid container not found');
  return m[1];
};

// ---- A: shop prerender ----
gate('A01', 'shop.html #shopGrid static markup == live renderGrid() output (byte-exact)', () => {
  const staticGrid = gridOf(rd('shop.html'));
  const jsGrid = captureRenderGrid();
  return staticGrid === jsGrid;
});
gate('A02', 'prerendered grid: 12 cards / 6 hover imgs / every img has width+height+alt / no png', () => {
  const g = gridOf(rd('shop.html'));
  const cards = (g.match(/<a href="product.html\?id=/g) || []).length;
  const hover = (g.match(/class="hover-img"/g) || []).length;
  const noWH = (g.match(/<img(?![^>]*width=")/g) || []).length;
  const noAlt = (g.match(/<img(?![^>]*alt=")/g) || []).length;
  const png = (g.match(/assets\/images\/[A-Za-z0-9_-]+\.png/g) || []).length;
  return cards === 12 && hover === 6 && noWH === 0 && noAlt === 0 && png === 0;
});
gate('A03', 'shop.html: exactly one h1 = ALL PRODUCTS, no leftover div.title-left', () => {
  const h = rd('shop.html');
  const h1s = h.match(/<h1[^>]*>/g) || [];
  return h1s.length === 1 && h.includes('<h1 class="title-left">ALL PRODUCTS</h1>')
      && !h.includes('<div class="title-left">');
});

// ---- B: outline / landmark / og ----
gate('B01', 'lookbook.html: one h1 (closing-statement, text preserved), no h2 version', () => {
  const h = rd('lookbook.html');
  return h.includes('<h1 class="closing-statement js-reveal">Worn by people, not mannequins.</h1>')
      && !h.includes('<h2 class="closing-statement')
      && (h.match(/<h1[^>]*>/g) || []).length === 1;
});
gate('B02', 'product.html: h2 complete-look-label; full og+twitter block with absolute hero-image.png', () => {
  const h = rd('product.html');
  if (h.includes('<h3 class="complete-look-label">')) return false;
  if (!h.includes('<h2 class="complete-look-label">COMPLETE THE LOOK</h2>')) return false;
  const need = [
    '<meta property="og:type" content="website" />',
    '<meta property="og:url" content="https://kxm-by-divyaraj.vercel.app/product.html" />',
    '<meta property="og:title" content="KXM — Product Details" />',
    '<meta property="og:image" content="https://kxm-by-divyaraj.vercel.app/assets/images/hero-image.png" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:image" content="https://kxm-by-divyaraj.vercel.app/assets/images/hero-image.png" />',
  ];
  return need.every(s => h.includes(s));
});
gate('B03', 'about.html: <main id="main"> wraps hero + all sections (closes before FOOTER)', () => {
  const h = rd('about.html');
  const open = (h.match(/<main id="main"><header class="about-hero">/g) || []).length;
  const close = (h.match(/<\/main>/g) || []).length;
  const footAt = h.indexOf('<!-- FOOTER -->');
  const mainCloseAt = h.indexOf('</main>');
  const headerPair = (h.match(/<header class="about-hero">/g) || []).length
                   + (h.match(/<\/header>/g) || []).length;
  return open === 1 && close === 1 && mainCloseAt < footAt && headerPair === 2;
});
gate('B04', 'legal pages: h1.legal-title-left promoted (texts exact), no div versions', () => {
  const map = { 'privacy-policy.html': 'PRIVACY POLICY', 'returns.html': 'RETURNS',
                'shipping.html': 'SHIPPING', 'terms-of-service.html': 'TERMS OF SERVICE' };
  for (const [f, t] of Object.entries(map)) {
    const h = rd(f);
    if (!h.includes(`<h1 class="legal-title-left">${t}</h1>`)) throw new Error(`${f} h1 missing`);
    if (h.includes('<div class="legal-title-left">')) throw new Error(`${f} div remains`);
  }
  return true;
});

// ---- C: invariants (sha256 vs pre-K2 live bytes) ----
const INV = JSON.parse(rd('test_k2_invariants.json'));
gate('C01', `${Object.keys(INV).length} untouched files byte-identical (sha256)`, () => {
  for (const [f, h] of Object.entries(INV)) {
    if (!fs.existsSync(f)) throw new Error('missing ' + f);
    if (sha(fs.readFileSync(f)) !== h) throw new Error('changed ' + f);
  }
  return true;
});

// ---- D: manifest ----
gate('D01', 'PACKAGE-MANIFEST.txt sha256 verify (every entry)', () => {
  let n = 0;
  for (const line of rd('PACKAGE-MANIFEST.txt').split('\n')) {
    const m = line.match(/^([a-f0-9]{64})\s+(\d+)\s+(\S+)$/);
    if (!m) continue;
    const b = fs.readFileSync(m[3]);
    if (sha(b) !== m[1] || b.length !== Number(m[2])) throw new Error('mismatch ' + m[3]);
    n++;
  }
  if (n < 9) throw new Error('only ' + n + ' entries');
  return true;
});

console.log(`\nRESULT: PASS ${pass} / FAIL ${fail}` + (skip ? ` / SKIP ${skip}` : ''));
if (fail) { console.log('FAILURES: ' + failures.join(', ')); process.exit(1); }
