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
    const nav = Array.from(document.querySelectorAll('nav')).find(n => n.className.includes('fixed'));
    if (!nav) return 'no mobile nav';
    const row = nav.firstElementChild;
    const btns = Array.from(row.querySelectorAll('button'));
    return {
      viewportW: window.innerWidth,
      rowScrollW: row.scrollWidth,
      rowClientW: row.clientWidth,
      btns: btns.map(b => { const r = b.getBoundingClientRect(); return { label: b.textContent.trim().slice(0,22), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), onScreen: r.right <= window.innerWidth }; }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
