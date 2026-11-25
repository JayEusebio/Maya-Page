const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const w of [320, 390, 430, 700]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, isMobile: true, hasTouch: true });
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(() => { const b = document.querySelector('.banner').getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: b.bottom }; });
    await p.screenshot({ path: `aud2/ban${w}.png`, clip: r });
    await p.close();
  }
  await b.close();
})();
