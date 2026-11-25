// usage: node shot.js <width> <height> <outPrefix> [mobile]
const { chromium } = require('playwright-core');
(async () => {
  const [w, h, out, mobile] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  // scroll through so every ScrollTrigger fires, then back to top
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(+h * 0.6)) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500);
  // viewport screenshots down the page
  let i = 0;
  for (let y = 0; y < total; y += +h) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}_${String(i++).padStart(2, '0')}.png` });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('height', total, 'h-overflow', overflow);
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
