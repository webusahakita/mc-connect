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

  // Click Event Command Center
  console.log('Clicking Event Command Center...');
  await page.evaluate(() => {
    const el = document.getElementById('menu-command-center');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'scripts/verify_ecc_modern.png', fullPage: true });
  console.log('✅ Screenshot ECC saved to scripts/verify_ecc_modern.png');

  await browser.close();
  console.log('Done!');
})();
