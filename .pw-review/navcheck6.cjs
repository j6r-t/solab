const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await m.newPage();
  p.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE:', msg.text().slice(0, 200)); });
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('input[type="email"]', { timeout: 15000 }).catch(() => {});
  const hasForm = await p.locator('input[type="email"]').count();
  console.log('login form present:', hasForm);
  if (hasForm) {
    await p.locator('input[type="email"]').fill('owner@sofien.tn');
    await p.locator('input[type="password"]').fill('admin123');
    await Promise.all([
      p.waitForResponse(r => r.url().includes('/api/auth/login'), { timeout: 15000 }).then(r => console.log('login api status:', r.status())).catch(() => console.log('no login api call')),
      p.locator('button[type="submit"]').click(),
    ]);
    await p.waitForTimeout(3000);
  }
  await p.screenshot({ path: 'shots/debug-state.png' });
  const info = await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Tableau'));
    if (!btn) return { found: false, url: location.href, bodyStart: document.body.innerText.slice(0, 300) };
    const row = btn.parentElement;
    const rowBtns = Array.from(row.querySelectorAll(':scope > button'));
    return {
      found: true,
      viewportW: window.innerWidth,
      rowScrollW: row.scrollWidth,
      rowClientW: row.clientWidth,
      btns: rowBtns.map(b => { const r = b.getBoundingClientRect(); return { label: (b.textContent || '').trim().slice(0, 26), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
