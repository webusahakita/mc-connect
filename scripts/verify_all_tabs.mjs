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

  console.log('1. Navigating to login...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });

  // If on login page, fill credentials
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Logging in...');
    await page.type('input[type="email"]', 'vanya@mcconnect.id');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));
  }

  // 1. Verify Kalender Acara
  console.log('2. Verifying Kalender Acara...');
  const calBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Kalender Acara'));
  });
  if (calBtn) {
    await calBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'scripts/tab_test_calendar.png' });
  }

  // 2. Open dropdown Pengaturan -> CMS Konten
  console.log('3. Verifying CMS Konten tabs...');
  const pengBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Pengaturan') && !b.textContent.includes('Web'));
  });
  if (pengBtn) {
    await pengBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }
  
  const cmsBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('CMS Konten'));
  });
  if (cmsBtn) {
    await cmsBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/tab_test_cms_tab1.png' });
  }

  // Click second tab: Layanan
  const layananTab = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    return btns.find(b => b.textContent.includes('Layanan'));
  });
  if (layananTab) {
    await layananTab.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'scripts/tab_test_cms_tab2_layanan.png' });
  }

  // 3. Verifying Pengaturan Web tabs
  console.log('4. Verifying Pengaturan Web tabs...');
  const webBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Pengaturan Web'));
  });
  if (webBtn) {
    await webBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/tab_test_web_tab1_payment.png' });
  }

  // Click tab 2: Kategori Acara
  const katTab = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    return btns.find(b => b.textContent.includes('Kategori Acara'));
  });
  if (katTab) {
    await katTab.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'scripts/tab_test_web_tab2_kategori.png' });
  }

  // Click tab 6: Logo Web & Invoice
  const logoTab = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    return btns.find(b => b.textContent.includes('Logo Web & Invoice'));
  });
  if (logoTab) {
    await logoTab.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'scripts/tab_test_web_tab6_logo.png' });
  }

  // Click tab 7: Keamanan Akun
  const secTab = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('.cms-tab-btn'));
    return btns.find(b => b.textContent.includes('Keamanan Akun'));
  });
  if (secTab) {
    await secTab.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'scripts/tab_test_web_tab7_security.png' });
  }

  console.log('✅ ALL TAB TESTS COMPLETED AND SCREENSHOTS SAVED!');
  await browser.close();
})();
