import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:9000';

async function runStep1Verification() {
  console.log('🧪 Memulai [Langkah 1] Verifikasi Interaktif Fitur Admin Baru...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', err => errors.push(`[PageError] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[ConsoleError] ${msg.text()}`);
  });

  try {
    // 1. Login
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(async () => {
      await fetch('/api/mc/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' })
      });
    });

    // 2. Akses /admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.admin-sidebar', { timeout: 8000 });
    console.log('✓ Admin Sidebar terdeteksi.');

    // 3. Verifikasi Menu Data Pelanggan (Default)
    await page.waitForSelector('input[placeholder*="Cari nama"]', { timeout: 5000 });
    const rowCount = await page.$$eval('#sec-customers tbody tr', rows => rows.length);
    console.log(`✓ Data Pelanggan termuat dengan ${rowCount} baris klien.`);

    // 4. Uji Filter Pencarian
    await page.type('input[placeholder*="Cari nama"]', 'Farhan');
    await new Promise(r => setTimeout(r, 300));
    const filteredCount = await page.$$eval('#sec-customers tbody tr', rows => rows.length);
    console.log(`✓ Pencarian 'Farhan' menghasilkan ${filteredCount} baris.`);
    if (filteredCount !== 1) throw new Error('Filter pencarian gagal memfilter ke Farhan.');

    // Reset pencarian
    await page.$eval('input[placeholder*="Cari nama"]', el => el.value = '');
    await page.type('input[placeholder*="Cari nama"]', ' ');
    await page.keyboard.press('Backspace');

    // 5. Uji Navigasi ke Dashboard
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Dashboard'));
      if (b) b.click();
    });
    await page.waitForSelector('.stat-metric-card.gold', { timeout: 5000 });
    const revText = await page.$eval('.stat-metric-card.gold .stat-metric-val', el => el.textContent.trim());
    console.log(`✓ Menu Dashboard aktif. Total Pendapatan: ${revText}`);

    // 6. Uji Navigasi ke Event Command Center
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Event Command Center'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-command-center select', { timeout: 5000 });
    console.log('✓ Menu Event Command Center aktif dengan event picker.');

    // 7. Uji Navigasi ke Kalender Acara
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Kalender Acara'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-calendar', { timeout: 5000 });
    console.log('✓ Menu Kalender Acara aktif.');

    // 8. Uji Navigasi ke Cash Flow
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Cash Flow'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-cashflow table', { timeout: 5000 });
    console.log('✓ Menu Cash Flow aktif.');

    // 9. Uji Navigasi ke Wardrobe Tracker
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Wardrobe Tracker'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-wardrobe', { timeout: 5000 });
    console.log('✓ Menu Wardrobe Tracker aktif.');

    // 10. Uji Navigasi ke Master Bank Musik
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Master Bank Musik'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-musicbank table', { timeout: 5000 });
    console.log('✓ Menu Master Bank Musik aktif.');

    // 11. Uji Navigasi ke Pengaturan CMS
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Pengaturan'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-settings form', { timeout: 5000 });
    console.log('✓ Menu Pengaturan CMS aktif.');

    // 12. Uji Navigasi ke Panduan & Fitur
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Panduan & Fitur'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-guide', { timeout: 5000 });
    console.log('✓ Menu Panduan & Fitur aktif.');

    console.log('\n🎉 [LANGKAH 1 SELESAI]: Seluruh navigasi 9 menu sidebar & interaksi CRM 100% PASSED!');
  } catch (err) {
    console.error(`❌ UJI LANGKAH 1 GAGAL: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runStep1Verification();
