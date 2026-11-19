import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Nawakara/.gemini/antigravity/brain/de6a4589-f812-4d66-93be-7309d1ce2bad';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  await page.goto('http://127.0.0.1:9000/');
  await page.evaluate(async () => {
    await fetch('/api/mc/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' })
    });
  });

  // Navigate to /admin
  await page.goto('http://127.0.0.1:9000/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.admin-sidebar', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: Customers View
  const custScreenshotPath = `${ARTIFACT_DIR}/react_admin_customers_view.png`;
  await page.screenshot({ path: custScreenshotPath, fullPage: false });
  console.log('Saved customers screenshot to:', custScreenshotPath);

  // Click Dashboard
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
    const dashBtn = btns.find(b => b.textContent.includes('Dashboard'));
    if (dashBtn) dashBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 2: Dashboard View
  const dashScreenshotPath = `${ARTIFACT_DIR}/react_admin_dashboard_view.png`;
  await page.screenshot({ path: dashScreenshotPath, fullPage: false });
  console.log('Saved dashboard screenshot to:', dashScreenshotPath);

  await browser.close();
  console.log('✅ Visual verification completed successfully!');
}

run();
