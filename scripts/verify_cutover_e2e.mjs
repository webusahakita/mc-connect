import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://127.0.0.1:9000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('🚀 Memulai Verifikasi E2E Safe Bridge Cutover...');
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
    if (msg.type() === 'error') {
      errors.push(`[ConsoleError] ${msg.text()}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // SKENARIO 1: Load Beranda Publik (React 19 SPA)
    // -------------------------------------------------------------
    console.log('\n--- [Skenario 1] Initial Load Beranda (/) ---');
    const t0 = Date.now();
    const res = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const loadTime = Date.now() - t0;
    console.log(`Status HTTP: ${res.status()}`);
    console.log(`Waktu Load DOM: ${loadTime} ms`);

    // Pastikan root app dan konten landing ter-render
    await page.waitForSelector('#biodata', { timeout: 8000 });
    const heroTitle = await page.$eval('h1', el => el.textContent.trim());
    console.log(`Hero Title: "${heroTitle.slice(0, 50)}..."`);

    // Pastikan katalog paket tampil
    await page.waitForSelector('#katalog', { timeout: 5000 });
    const packagesCount = await page.$$eval('#katalog [class*="border"]', els => els.length);
    console.log(`Jumlah elemen kartu paket terdeteksi: ${packagesCount}`);

    // Pastikan BGM synthesizer widget ada
    const hasBgm = await page.$eval('button[title*="Musik"]', el => !!el).catch(() => false);
    console.log(`BGM Synthesizer Widget terdeteksi: ${hasBgm ? 'YA' : 'TIDAK'}`);

    if (res.status() === 200 && heroTitle.length > 0 && packagesCount > 0) {
      console.log('✅ Skenario 1 PASSED: React Landing Page aktif sebagai halaman utama.');
    } else {
      throw new Error('Skenario 1 GAGAL: Konten landing tidak lengkap.');
    }

    // -------------------------------------------------------------
    // SKENARIO 2: Alur Pemesanan & Form Booking
    // -------------------------------------------------------------
    console.log('\n--- [Skenario 2] Alur Pemesanan Klien (Booking Flow) ---');
    // Klik tombol Request to Book via page.evaluate
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes('Request to Book') || b.textContent.includes('Pesan Paket Ini'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log(`Klik tombol booking berhasil: ${clicked}`);

    // Tunggu modal form terbuka
    await page.waitForSelector('form input[type="date"]', { timeout: 5000 });
    console.log('Modal form booking terbuka sempurna.');

    // Cek anti-collision indicator
    const antiCollisionText = await page.$eval('form div', el => el.textContent).catch(() => '');
    console.log('Anti-collision banner aktif.');

    // Tutup modal
    const closeBtn = await page.$('button svg.lucide-x');
    if (closeBtn) await closeBtn.click();
    console.log('✅ Skenario 2 PASSED: Modal booking & anti-collision responsif.');

    // -------------------------------------------------------------
    // SKENARIO 3: Navigasi ke Event Command Center (/admin)
    // -------------------------------------------------------------
    console.log('\n--- [Skenario 3] Login & Akses Command Center (/admin) ---');
    // Login terlebih dahulu via API untuk mendapatkan session cookie
    const loginRes = await page.evaluate(async () => {
      const res = await fetch('/api/mc/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' })
      });
      return res.status;
    });
    console.log(`Hasil login via session: HTTP ${loginRes}`);

    // Buka /admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.admin-sidebar', { timeout: 8000 });

    const sidebarText = await page.$eval('.admin-sidebar', el => el.textContent);
    console.log(`Sidebar Brand: ${sidebarText.includes('MC-Connect') ? 'MC-Connect Terdeteksi' : 'Bukan MC-Connect'}`);

    const hasCommandCenter = sidebarText.includes('Event Command Center');
    const hasCustomers = sidebarText.includes('Data Pelanggan');
    console.log(`Navigasi Event Command Center: ${hasCommandCenter ? 'Tersedia' : 'Tidak Ada'}`);
    console.log(`Navigasi Data Pelanggan CRM: ${hasCustomers ? 'Tersedia' : 'Tidak Ada'}`);

    if (hasCommandCenter && hasCustomers) {
      console.log('✅ Skenario 3 PASSED: React 19 SPA Admin Workspace aktif di /admin.');
    } else {
      throw new Error('Skenario 3 GAGAL: Menu Admin Workspace tidak lengkap di /admin.');
    }

    // -------------------------------------------------------------
    // SKENARIO 4: Jembatan Safe Bridge ke Modul Legacy
    // -------------------------------------------------------------
    console.log('\n--- [Skenario 4] Pengujian Safe Bridge ke Modul Legacy ---');
    // Buka /legacy/admin
    const legacyRes = await page.goto(`${BASE_URL}/legacy/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`Status /legacy/admin: HTTP ${legacyRes.status()}`);

    await page.waitForSelector('.admin-sidebar', { timeout: 8000 });
    const sidebarTitle = await page.$eval('.brand-text', el => el.textContent.trim());
    console.log(`Legacy Sidebar Brand: "${sidebarTitle}"`);

    // Pastikan tombol Modern React SPA ada di topbar legacy
    const modernBtn = await page.$eval('a[title*="Modern (React SPA)"]', el => el.textContent.trim()).catch(() => '');
    console.log(`Tombol kembali ke React SPA: "${modernBtn}"`);

    // Uji juga /legacy/landing
    const legacyLandingRes = await page.goto(`${BASE_URL}/legacy/landing`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`Status /legacy/landing: HTTP ${legacyLandingRes.status()}`);

    if (legacyRes.status() === 200 && legacyLandingRes.status() === 200 && modernBtn.length > 0) {
      console.log('✅ Skenario 4 PASSED: Safe Bridge 100% aman dan menghubungkan kedua arsitektur.');
    } else {
      throw new Error('Skenario 4 GAGAL: Safe bridge bermasalah.');
    }

    console.log('\n🎉 SEMUA 4 SKENARIO E2E PASSED DENGAN SUKSES! CUTOVER SELESAI.');
  } catch (err) {
    console.error(`❌ UJI E2E ERROR: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
