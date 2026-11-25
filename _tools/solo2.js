const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const file = 'file:///' + path.join(process.env.TEMP, 'solo_test', 'Maya-Deposit-747Live.html').split(path.sep).join('/');
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(file, { waitUntil: 'load' });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => { const bad = [...document.images].filter(i => !i.naturalWidth); return `${document.images.length - bad.length}/${document.images.length} images loaded` + (bad.length ? ' missing: ' + bad.map(i => i.className).join(',') : ''); }));
  await b.close();
})();
