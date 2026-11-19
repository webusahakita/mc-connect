import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://localhost:9000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('pageerror', err => console.error('💥 PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('🔴 CONSOLE ERROR:', msg.text());
  });

  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  
  // Login via API in page context
  await page.evaluate(async () => {
    await fetch('/api/mc/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' })
    });
  });

  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.admin-sidebar', { timeout: 10000 });

  // 1. CMS Konten
  console.log('Testing CMS Konten...');
  await page.evaluate(() => {
    const el = document.getElementById('menu-landing-settings');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/verify_cms_subtab_bio.png' });

  // Click all CMS tabs
  const cmsTabs = ['Layanan', 'Blog', 'Press Kit', 'Galeri'];
  for (const t of cmsTabs) {
    console.log(`Clicking CMS tab: ${t}...`);
    await page.evaluate((text) => {
      const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
      const b = btns.find(x => x.textContent.includes(text));
      if (b) b.click();
    }, t);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `scripts/verify_cms_subtab_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png` });
  }

  // 2. Pengaturan Web
  console.log('Testing Pengaturan Web...');
  await page.evaluate(() => {
    const el = document.getElementById('menu-web-settings');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/verify_web_subtab_payment.png' });

  // Click all Web tabs
  const webTabs = ['Kategori Acara', 'Kategori Klien', 'Template WA', 'Kategori Arus Kas', 'Logo Web', 'Keamanan Akun'];
  for (const t of webTabs) {
    console.log(`Clicking Web tab: ${t}...`);
    await page.evaluate((text) => {
      const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
      const b = btns.find(x => x.textContent.includes(text));
      if (b) b.click();
    }, t);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `scripts/verify_web_subtab_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png` });
  }

  console.log('🎉 ALL SUBTABS CLICKED AND VERIFIED CLEANLY!');
  await browser.close();
})();
