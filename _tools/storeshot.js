const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[1440, 900, 0], [390, 844, 1]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: !!m });
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.stores').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => { const a = document.querySelector('.perks').getBoundingClientRect(), f = document.querySelector('.app .fine').getBoundingClientRect(); return { x: Math.max(0, a.left - 30), y: a.top - 20, width: Math.min(innerWidth - Math.max(0, a.left - 30), 560), height: f.bottom - a.top + 40 }; });
    await p.screenshot({ path: `aud2/store${w}.png`, clip: r });
    await p.close();
  }
  await b.close();
})();
