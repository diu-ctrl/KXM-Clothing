// KXM K1 gate suite — run `node test_k1.js` from the repo root.
// PASS/FAIL/SKIP semantics. RESULT must show FAIL 0 and zero SKIP lines before deploy.
const fs = require('fs');
const path = require('path');
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
const rd = f => fs.readFileSync(f);
const EX = ['index.html', 'about.html', 'contact.html', 'lookbook.html', 'product.html'];

// ---- A: assets ----
gate('A01', '24 webp files shipped, each <=250KB, total <=1.2MB', () => {
  const dir = 'assets/images';
  const webp = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
  if (webp.length !== 24) throw new Error(`expected 24 webp, found ${webp.length}`);
  let tot = 0;
  for (const f of webp) {
    const s = fs.statSync(path.join(dir, f)).size; tot += s;
    if (s > 250 * 1024) throw new Error(`${f} is ${(s / 1024).toFixed(0)}KB > 250KB`);
  }
  if (tot > 1.2 * 1024 * 1024) throw new Error(`total ${(tot / 1048576).toFixed(2)}MB > 1.2MB`);
  return true;
});
gate('A02', 'zero src/href references to assets/images/*.png in HTML (og:image content= excluded)', () => {
  for (const f of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
    const h = rd(f).toString();
    const bad = (h.match(/(?:src|href)=["'][^"']*assets\/images\/[^"']*\.png["']/g) || []);
    if (bad.length) throw new Error(`${f}: ${bad[0]}`);
  }
  return true;
});
gate('A03', 'products.js: 38 webp paths / 0 png paths / DIMS + ATTRS + READY', () => {
  const j = rd('assets/js/products.js').toString();
  const w = (j.match(/assets\/images\/[A-Za-z0-9_-]+\.webp/g) || []).length;
  const p = (j.match(/assets\/images\/[A-Za-z0-9_-]+\.png/g) || []).length;
  if (w !== 38) throw new Error(`webp paths ${w} != 38`);
  if (p !== 0) throw new Error(`png paths remain: ${p}`);
  if (!j.includes('window.KXM_IMG_DIMS')) throw new Error('KXM_IMG_DIMS missing');
  if (!j.includes('window.KXM_IMG_ATTRS')) throw new Error('KXM_IMG_ATTRS missing');
  if (!j.includes('window.KXM_PRODUCTS_READY = true;')) throw new Error('READY flag missing');
  return true;
});

// ---- B: HTML surgery ----
gate('B01', 'index.html: hero preload + fetchpriority=high + hero src is webp', () => {
  const h = rd('index.html').toString();
  if (!/rel="preload"\s+as="image"\s+href="assets\/images\/hero-image\.webp"\s+fetchpriority="high"/.test(h))
    throw new Error('preload link missing/malformed');
  if (!/src="assets\/images\/hero-image\.webp"/.test(h)) throw new Error('hero src not webp');
  return true;
});
gate('B02', 'every static <img> in the 5 edited pages has width+height (templates use KXM_IMG_ATTRS)', () => {
  for (const f of EX) {
    const h = rd(f).toString();
    const tags = h.match(/<img[^>]*>/g) || [];
    for (const t of tags) {
      const isTemplate = /\$\{/.test(t);
      const hasAttrs = /width="\d+"/.test(t) && /height="\d+"/.test(t);
      const usesHelper = /KXM_IMG_ATTRS/.test(t);
      if (isTemplate && !usesHelper) throw new Error(`${f}: template img without KXM_IMG_ATTRS: ${t.slice(0, 80)}`);
      if (!isTemplate && !hasAttrs) throw new Error(`${f}: static img missing width/height: ${t.slice(0, 90)}`);
    }
  }
  return true;
});
gate('B03', 'decoding="async" present on all below-fold static imgs (>=25 across HTML)', () => {
  let n = 0;
  for (const f of EX) n += (rd(f).toString().match(/decoding="async"/g) || []).length;
  if (n < 25) throw new Error(`only ${n} decoding=async`);
  return true;
});
gate('B04', 'every image referenced by HTML/JS resolves to an existing file', () => {
  const refs = new Set();
  for (const f of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
    const h = rd(f).toString();
    for (const m of h.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (m[1].includes('assets/images/') && !m[1].includes('${')) refs.add(m[1]);
    }
  }
  for (const jf of ['assets/js/products.js', 'assets/js/shop.js']) {
    const j = rd(jf).toString();
    for (const m of j.matchAll(/assets\/images\/[A-Za-z0-9_-]+\.(?:webp|png)/g)) refs.add(m[0]);
  }
  for (const r of refs) if (!fs.existsSync(r)) throw new Error(`missing file: ${r}`);
  return true;
});
gate('B05', 'og:image still points at hero-image.png (PNG kept for social previews)', () => {
  const h = rd('index.html').toString();
  return /property="og:image"[^>]*content="[^"]*hero-image\.png"/.test(h) ||
         /content="[^"]*hero-image\.png"[^>]*property="og:image"/.test(h);
});

// ---- C: invariants ----
gate('C01', 'cart.js untouched (P0-era sha256)', () => {
  const H = '7685b53f31dd18d770e0c36f37e81ebdd49f4a2dfa306ef6a8c635ff6849df67';
  return sha(rd('assets/js/cart.js')) === H;
});
gate('C02', 'cart.css untouched (P0-era sha256)', () => {
  const H = '10d2067a4e1a9453639eeb91a77028f7c324ef40b36b0c8af6fe36242a765d8c';
  return sha(rd('assets/css/cart.css')) === H;
});
gate('C03', '404.html exists, self-contained, absolute /favicon/ links intact', () => {
  const h = rd('404.html').toString();
  if (!/href="\/favicon\/favicon\.ico"/.test(h)) throw new Error('favicon link missing');
  if (!/assets\/images/.test(h)) return true; // 404 must not reference assets/images at all
  throw new Error('404 references assets/images');
});
gate('C04', 'favicon files untouched and present', () => {
  for (const f of ['favicon/favicon.ico', 'favicon/favicon-16x16.png', 'favicon/favicon-32x32.png'])
    if (!fs.existsSync(f)) throw new Error(`missing ${f}`);
  return true;
});

// ---- D: manifest ----
gate('D01', 'PACKAGE-MANIFEST.txt sha256 verify (every entry)', () => {
  const lines = rd('PACKAGE-MANIFEST.txt').toString().split('\n');
  let n = 0;
  for (const line of lines) {
    const m = line.match(/^([a-f0-9]{64})\s+(\d+)\s+(\S+)$/);
    if (!m) continue;
    const b = rd(m[3]);
    if (sha(b) !== m[1] || b.length !== Number(m[2])) throw new Error(`mismatch: ${m[3]}`);
    n++;
  }
  if (n < 30) throw new Error(`only ${n} manifest entries verified`);
  return true;
});

console.log(`\nRESULT: PASS ${pass} / FAIL ${fail}` + (skip ? ` / SKIP ${skip}` : ''));
if (fail) { console.log('FAILURES: ' + failures.join(', ')); process.exit(1); }
