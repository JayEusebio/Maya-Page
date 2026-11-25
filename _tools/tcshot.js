const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[390, 844, 1], [1440, 900, 0]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: !!m, hasTouch: !!m });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.tc').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(1500);
    await p.evaluate(() => scrollBy(0, -90));
    await p.waitForTimeout(800);
    await (await p.$('.tc')).screenshot({ path: `aud2/tc_closed_${w}.png` });
    await p.click('.tc__btn');
    await p.waitForTimeout(2200);
    await (await p.$('.tc')).screenshot({ path: `aud2/tc_open_${w}.png` });
    console.log(w, errs.join(';') || 'ok', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await p.close();
  }
  await b.close();
})();
