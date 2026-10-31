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
    await p.waitForTimeout(3000);
  }
  console.log('url:', p.url());
  console.log('body chars:', (await p.evaluate(() => document.body.innerHTML.length)));
  const info = await p.evaluate(() => {
    // find the button whose text starts with Tableau
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Tableau'));
    if (!btn) return { found: false, sample: document.body.innerHTML.slice(0, 400) };
    const bar = btn.closest('[class*="fixed"]') || btn.closest('nav');
    const row = btn.parentElement;
    const rowBtns = Array.from(row.querySelectorAll(':scope > button'));
    return {
      found: true,
      barClass: bar ? bar.className.slice(0, 100) : null,
      viewportW: window.innerWidth,
      rowScrollW: row.scrollWidth,
      rowClientW: row.clientWidth,
      btns: rowBtns.map(b => { const r = b.getBoundingClientRect(); return { label: (b.textContent || '').trim().slice(0, 24), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
