const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const file = 'file:///' + path.join(process.env.TEMP, 'solo_test', 'Maya-Deposit-747Live.html').split(path.sep).join('/');
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h, m] of [[390, 844, 1], [1440, 900, 0]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: !!m, hasTouch: !!m });
    const blocked = [], errs = [];
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:') || u.startsWith('data:')) r.continue(); else { blocked.push(u); r.abort(); } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', c => { if (c.type() === 'error') errs.push(c.text()); });
    await p.goto(file, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => ({
      gsap: !!window.gsap, three: !!window.THREE, lenis: !!window.Lenis,
      brokenImgs: [...document.images].filter(i => !i.complete || !i.naturalWidth).length,
      imgs: document.images.length,
      font: document.fonts.check('800 40px "Alumni Sans"') && [...document.fonts].filter(f => f.status === 'loaded').length,
    }));
    await p.screenshot({ path: `aud2/solo${w}.png` });
    await p.evaluate(() => document.querySelector('.tc').scrollIntoView());
    await p.waitForTimeout(1200);
    await p.click('.tc__btn'); await p.waitForTimeout(1500);
    const open = await p.evaluate(() => !document.querySelector('.tc__body').hidden);
    console.log(w, JSON.stringify(info), 'termsOpen', open, '| blocked', blocked.length, blocked.slice(0, 3).join(' '), '| errors', errs.join('; ') || 'none');
    await ctx.close();
  }
  await b.close();
})();
