const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await m.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('input[type="email"]', { timeout: 15000 }).catch(() => {});
  if (await p.locator('input[type="email"]').count()) {
    await p.locator('input[type="email"]').fill('owner@sofien.tn');
    await p.locator('input[type="password"]').fill('admin123');
    await p.locator('button[type="submit"]').click();
  }
  await p.waitForSelector('text=Tableau', { timeout: 20000 });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Tableau'));
    const row = btn.parentElement;
    const rowBtns = Array.from(row.querySelectorAll(':scope > button'));
    return {
      viewportW: window.innerWidth,
      rowScrollW: row.scrollWidth,
      rowClientW: row.clientWidth,
      barScrollable: getComputedStyle(row).overflowX,
      btns: rowBtns.map(b => { const r = b.getBoundingClientRect(); return { label: (b.textContent || '').trim().slice(0, 26), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
