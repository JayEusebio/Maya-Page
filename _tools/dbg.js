const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://127.0.0.1:8747/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  console.log(await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => {
    const a = getComputedStyle(c, '::after'); return [c.style.cssText, a.opacity, a.content, getComputedStyle(c).getPropertyValue('--dim')].join(' | ');
  }).join('\n')));
  await b.close();
})();
