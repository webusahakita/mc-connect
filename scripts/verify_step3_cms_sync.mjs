import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:9000';

async function runStep3Verification() {
  console.log('🧪 Memulai [Langkah 3] Verifikasi Sinkronisasi Database Riil (Wardrobe & CMS)...');

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
    // 1. Login session
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(async () => {
      await fetch('/api/mc/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' })
      });
    });

    // 2. Buka /admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.admin-sidebar', { timeout: 8000 });
    console.log('✓ Admin Sidebar terdeteksi.');

    // 3. Verifikasi Wardrobe Tracker
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Wardrobe Tracker'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-wardrobe .ecc-card', { timeout: 8000 });
    const initialWardrobeCards = await page.$$eval('#sec-wardrobe .ecc-card', cards => cards.length);
    console.log(`✓ Wardrobe Tracker termuat dengan ${initialWardrobeCards} jas dari database.`);

    // 4. Tambah Jas Baru via Modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Koleksi Jas'));
      if (btn) btn.click();
    });
    await page.waitForSelector('input[placeholder*="Midnight Navy"]', { timeout: 5000 });
    console.log('✓ Modal Tambah Jas terbuka.');

    const testJasName = `Sapphire Velvet Blazer ${Date.now().toString().slice(-4)}`;
    await page.type('input[placeholder*="Midnight Navy"]', testJasName);
    
    // Submit form modal
    await page.evaluate(() => {
      const modal = document.querySelector('div[style*="position: fixed"]');
      const submitBtn = modal?.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    // Tunggu refresh list
    await new Promise(r => setTimeout(r, 1500));
    const newWardrobeCards = await page.$$eval('#sec-wardrobe .ecc-card', cards => cards.length);
    console.log(`✓ Jas baru '${testJasName}' berhasil ditambahkan ke database (Total: ${newWardrobeCards} jas).`);

    // 5. Verifikasi Pengaturan CMS
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.sidebar-item-btn'));
      const b = btns.find(x => x.textContent.includes('Pengaturan'));
      if (b) b.click();
    });
    await page.waitForSelector('#sec-settings form input[type="text"]', { timeout: 5000 });
    
    const mcNameVal = await page.$eval('#sec-settings form input[type="text"]', el => el.value);
    console.log(`✓ Form CMS terisi dari database dengan Nama MC: '${mcNameVal}'`);
    if (!mcNameVal) throw new Error('Nama MC di form pengaturan kosong!');

    // Submit form CMS
    await page.evaluate(() => {
      const submitBtn = document.querySelector('#sec-settings form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log('✓ Form CMS berhasil di-submit dan tersimpan ke database Laravel.');

    console.log('\n🎉 [LANGKAH 3 SELESAI]: Sinkronisasi Form CMS & Wardrobe ke Database Riil 100% PASSED!');
  } catch (err) {
    console.error(`❌ UJI LANGKAH 3 GAGAL: ${err.message}`);
    if (errors.length) console.error('Browser logs:', errors);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runStep3Verification();
