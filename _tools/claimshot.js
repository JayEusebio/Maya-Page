const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, n] of [[390, 844, 'c390'], [320, 568, 'c320'], [844, 390, 'c844']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.claim').scrollIntoView());
    await p.waitForTimeout(1500);
    await p.evaluate(() => scrollBy(0, document.querySelector('.claim__stage').getBoundingClientRect().top - 70));
    await p.waitForTimeout(5000);
    await p.screenshot({ path: `aud2/${n}.png` });
    await p.close();
  }
  await b.close();
})();
