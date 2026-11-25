const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[1920, 1080, 0], [390, 844, 1]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: !!m });
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.band').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `aud2/band${w}.png` });
    console.log(w, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await p.close();
  }
  await b.close();
})();
