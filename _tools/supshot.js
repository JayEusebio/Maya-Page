const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[390, 844, 1], [1440, 900, 0]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: !!m, hasTouch: !!m });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.tc').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(600);
    await p.evaluate(() => scrollBy(0, -120));
    await p.waitForTimeout(4800);
    const r = await p.evaluate(() => { const a = document.querySelector('.tc').getBoundingClientRect(), s = document.querySelector('.support').getBoundingClientRect(); return { x: 0, y: Math.max(0, a.top - 20), width: innerWidth, height: Math.min(s.bottom + 20, innerHeight) - Math.max(0, a.top - 20) }; });
    await p.screenshot({ path: `aud2/sup${w}.png`, clip: r });
    console.log(w, errs.join(';') || 'ok', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await p.close();
  }
  await b.close();
})();
