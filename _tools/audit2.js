// Responsive audit: node audit.js [shots]
const { chromium } = require('playwright-core');
const sizes = [
  [320, 568, 1], [360, 740, 1], [375, 667, 1], [390, 844, 1], [430, 932, 1],
  [844, 390, 1], [768, 1024, 1], [820, 1180, 1], [1024, 768, 0], [1100, 800, 0], [1180, 800, 0], [1280, 800, 0], [1440, 900, 0], [1920, 1080, 0],
];
(async () => {
  const shots = process.argv[2] === 'shots';
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, mob] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: !!mob, hasTouch: !!mob });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(h * .7)) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const W = innerWidth, out = { overflow: document.documentElement.scrollWidth - W, poke: [], clip: [], tap: [], tiny: [] };
      const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      const clipped = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p); if (/(hidden|clip)/.test(o.overflowX) || /(hidden|clip)/.test(o.overflow)) return true; } return false; };
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('svg') && el.tagName !== 'svg') continue;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        if ((b.right > W + 1 || b.left < -1) && !clipped(el) && cs.position !== 'fixed') out.poke.push(`${name(el)} [${Math.round(b.left)}..${Math.round(b.right)}]`);
        if (/^(H1|H2|H3|B|P|SPAN|SMALL|A|LI)$/.test(el.tagName) && el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible' && el.clientWidth) out.clip.push(`${name(el)} ${el.scrollWidth}>${el.clientWidth}`);
        if (/^(A|BUTTON|SUMMARY)$/.test(el.tagName) && !el.closest('p,li small') && (b.height < 40 || b.width < 40) && !el.closest('.foot__cols,.foot__bottom p,.hdr__menu')) out.tap.push(`${name(el)} ${Math.round(b.width)}x${Math.round(b.height)}`);
        const fs = parseFloat(cs.fontSize);
        if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && fs < 12) out.tiny.push(`${name(el)} ${fs}px "${el.textContent.trim().slice(0, 24)}"`);
      }
      // headline lines whose words wrap out of the mask
      for (const l of document.querySelectorAll('.mega .line')) if (l.scrollWidth > l.clientWidth + 2) out.clip.push('mega line ' + l.textContent.trim().replace(/\s+/g, ' '));
      return out;
    });
    const uniq = a => [...new Set(a)].slice(0, 12);
    console.log(`\n=== ${w}x${h} ${mob ? 'mobile' : 'desktop'} | h-overflow ${r.overflow}px ${errs.length ? '| ERR ' + errs.join(';') : ''}`);
    for (const k of ['poke', 'clip', 'tap', 'tiny']) if (r[k].length) console.log(`  ${k}: ` + uniq(r[k]).join('\n        '));
    if (shots) {
      let i = 0;
      for (let y = 0; y < total; y += h) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(500); await page.screenshot({ path: `aud2/${w}x${h}_${String(i++).padStart(2, '0')}.png` }); }
    }
    await page.close();
  }
  await browser.close();
})();
