const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[390, 844, 1], [1440, 900, 0]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: !!m });
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => scrollTo(0, document.querySelector('.hero').offsetTop - 300));
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `aud2/layer${w}.png` });
    await p.close();
  }
  await b.close();
})();
