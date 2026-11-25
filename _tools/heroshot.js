const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => scrollTo(0, document.querySelector('.hero').offsetTop - 80));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'aud2/hero1920.png' });
  // freeze coin facing camera for a glyph check
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(260); await (await p.$('.pill')).screenshot({ path: `aud2/pill_${i}.png` }); }
  await b.close();
})();
