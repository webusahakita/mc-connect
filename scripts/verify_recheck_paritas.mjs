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

  console.log('Navigating to http://localhost:9000/admin...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // If login modal is visible, click submit (it has default credentials pre-filled)
  const submitBtn = await page.$('form button[type="submit"]');
  if (submitBtn) {
    console.log('Login modal detected. Submitting login credentials...');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  }

  // Verify Admin Workspace is visible
  await page.waitForSelector('.admin-sidebar', { timeout: 10000 });
  console.log('Admin workspace loaded successfully!');

  // 1. Verify Event Command Center
  console.log('Navigating to Event Command Center...');
  const eccBtn = await page.$('#menu-command-center');
  if (eccBtn) {
    await eccBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'scripts/verify_ecc_modern.png', fullPage: true });
    console.log('✅ Screenshot ECC saved to scripts/verify_ecc_modern.png');
  }

  // 2. Verify CMS Konten
  console.log('Opening Settings dropdown...');
  const setToggle = await page.$('#menu-settings-toggle');
  if (setToggle) {
    await setToggle.click();
    await new Promise(r => setTimeout(r, 800));
  }
  const cmsBtn = await page.$('#menu-landing-settings');
  if (cmsBtn) {
    await cmsBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'scripts/verify_cms_modern.png', fullPage: true });
    console.log('✅ Screenshot CMS saved to scripts/verify_cms_modern.png');
  }

  // 3. Verify Pengaturan Web
  console.log('Opening Pengaturan Web...');
  const webBtn = await page.$('#menu-web-settings');
  if (webBtn) {
    await webBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'scripts/verify_web_settings_modern.png', fullPage: true });
    console.log('✅ Screenshot Web Settings saved to scripts/verify_web_settings_modern.png');
  }

  await browser.close();
  console.log('🎉 ALL 3 SCREENSHOTS CAPTURED SUCCESSFULLY!');
})();
