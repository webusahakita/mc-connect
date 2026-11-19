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

  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const submitBtn = await page.$('form button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  }

  await page.waitForSelector('.admin-sidebar', { timeout: 10000 });

  // 1. Click CMS Konten
  console.log('Navigating to CMS Konten...');
  await page.evaluate(() => {
    const el = document.getElementById('menu-landing-settings');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_cms_tab1.png' });

  // Click tab Layanan
  console.log('Clicking tab Layanan...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    const b = btns.find(x => x.textContent.includes('Layanan'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/verify_cms_tab2_layanan.png' });

  // 2. Click Pengaturan Web
  console.log('Navigating to Pengaturan Web...');
  await page.evaluate(() => {
    const el = document.getElementById('menu-web-settings');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_web_tab1_payment.png' });

  // Click tab Kategori Acara
  console.log('Clicking tab Kategori Acara...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    const b = btns.find(x => x.textContent.includes('Kategori Acara'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/verify_web_tab2_categories.png' });

  // Click tab Keamanan Akun
  console.log('Clicking tab Keamanan Akun...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    const b = btns.find(x => x.textContent.includes('Keamanan Akun'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/verify_web_tab7_security.png' });

  await browser.close();
  console.log('🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
})();
