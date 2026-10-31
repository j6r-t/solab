const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await m.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  if (await p.locator('input[type="email"]').count()) {
    await p.locator('input[type="email"]').fill('owner@sofien.tn');
    await p.locator('input[type="password"]').fill('admin123');
    await p.locator('button[type="submit"]').click();
    await p.waitForTimeout(2500);
  }
  const info = await p.evaluate(() => {
    const nav = document.querySelector('nav.md\:hidden') || document.querySelector('nav.fixed');
    if (!nav) return 'no mobile nav';
    const btns = Array.from(nav.querySelectorAll(':scope > div > button'));
    return {
      viewport: window.innerWidth,
      navScrollW: nav.querySelector(':scope > div')?.scrollWidth,
      btns: btns.map(b => { const r = b.getBoundingClientRect(); return { label: b.textContent.trim().slice(0,20), x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), visible: r.right <= window.innerWidth && r.left >= 0 }; }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  // touch target height of mobile nav buttons
  const sizes = await p.evaluate(() => Array.from(document.querySelectorAll('nav.fixed button, nav[class*="md:hidden"] button')).map(b => { const r = b.getBoundingClientRect(); return b.textContent.trim().slice(0,15) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); }));
  console.log(sizes.join('\n'));
  await browser.close();
})();
