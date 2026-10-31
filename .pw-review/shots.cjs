const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = ['dashboard','orders','stock','invoices','reports','settings','clients','cheques','purchase-invoices'];

async function shoot(page, name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log('shot', name);
}

(async () => {
  const browser = await chromium.launch();

  // ---- DESKTOP ----
  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await d.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  // if on login page, log in
  const email = p.locator('input[type="email"]');
  if (await email.count()) {
    await p.screenshot({ path: path.join(OUT, 'desktop-login.png') });
    await email.fill('owner@sofien.tn');
    await p.locator('input[type="password"]').fill('admin123');
    await p.locator('button[type="submit"]').click();
    await p.waitForTimeout(2500);
  }
  for (const v of VIEWS) {
    await p.goto('http://localhost:3000/?view=' + v, { waitUntil: 'networkidle' });
    await shoot(p, 'desktop-' + v);
  }
  // order detail dialog
  try {
    await p.goto('http://localhost:3000/?view=orders', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const row = p.locator('table tbody tr').first();
    if (await row.count()) { await row.click(); await p.waitForTimeout(1500); await shoot(p, 'desktop-order-detail'); }
  } catch (e) { console.log('order detail fail', e.message); }
  await d.close();

  // ---- MOBILE ----
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await m.newPage();
  await mp.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const memail = mp.locator('input[type="email"]');
  if (await memail.count()) {
    await mp.screenshot({ path: path.join(OUT, 'mobile-login.png') });
    await memail.fill('owner@sofien.tn');
    await mp.locator('input[type="password"]').fill('admin123');
    await mp.locator('button[type="submit"]').click();
    await mp.waitForTimeout(2500);
  }
  for (const v of VIEWS) {
    await mp.goto('http://localhost:3000/?view=' + v, { waitUntil: 'networkidle' });
    await shoot(mp, 'mobile-' + v);
  }
  // More sheet
  try {
    await mp.goto('http://localhost:3000/?view=dashboard', { waitUntil: 'networkidle' });
    await mp.locator('nav button', { hasText: 'More' }).click();
    await mp.waitForTimeout(800);
    await shoot(mp, 'mobile-more-sheet');
  } catch (e) { console.log('more sheet fail', e.message); }
  await m.close();
  await browser.close();
  console.log('done');
})();
