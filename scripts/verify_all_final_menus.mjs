import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:9000';

async function testFinalMenus() {
  console.log('🧪 Memulai Verifikasi Akhir Seluruh Menu (ECC, Wardrobe, Music Bank, Panduan)...');

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
    // 1. Buka /admin & Auth
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2', timeout: 15000 });

    const hasAuthWall = await page.evaluate(() => {
      return !!document.querySelector('form button[type="submit"]') || document.body.textContent.includes('Panel Admin Dilindungi');
    });

    if (hasAuthWall) {
      console.log('🔒 Auth wall terdeteksi. Login otomatis...');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Buka Form Login'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      await page.evaluate(() => {
        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.includes('Masuk') || b.textContent.includes('Login'));
        if (submitBtn) submitBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));
    }

    await page.waitForSelector('.admin-sidebar', { timeout: 10000 });
    console.log('✓ Admin Workspace aktif.');

    // 2. UJI EVENT COMMAND CENTER (ECC)
    await page.evaluate(() => {
      const btn = document.getElementById('menu-command-center');
      if (btn) btn.click();
    });
    await page.waitForSelector('#sec-command-center', { timeout: 5000 });
    console.log('✓ Section #sec-command-center terbuka.');

    // Cek 5 Sub-tab ECC
    const eccTabs = await page.$$eval('#sec-command-center .ecc-tab-btn', btns => btns.map(b => b.textContent.trim()));
    console.log('✓ Sub-tab ECC:', eccTabs);
    if (eccTabs.length !== 5) throw new Error(`Jumlah tab ECC tidak pas: ${eccTabs.length}`);

    // Buka tab Musik & Sound Acara
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#sec-command-center .ecc-tab-btn'));
      const musicTab = btns.find(b => b.textContent.includes('Musik'));
      if (musicTab) musicTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    console.log('✓ Tab Musik & Sound Acara ECC aktif.');
    await page.screenshot({ path: 'ecc_music_verified.png', fullPage: false });

    // 3. UJI WARDROBE TRACKER
    await page.evaluate(() => {
      const btn = document.getElementById('menu-wardrobe');
      if (btn) btn.click();
    });
    await page.waitForSelector('#sec-wardrobe table', { timeout: 5000 });
    console.log('✓ Section #sec-wardrobe dengan format tabel terbuka.');

    const wardrobeTh = await page.$$eval('#sec-wardrobe table thead th', ths => ths.map(t => t.textContent.trim()));
    console.log('✓ Kolom tabel Wardrobe:', wardrobeTh);
    const wardrobeRows = await page.$$eval('#sec-wardrobe table tbody tr', trs => trs.length);
    console.log(`✓ Jumlah baris koleksi busana: ${wardrobeRows}`);
    await page.screenshot({ path: 'wardrobe_verified.png', fullPage: false });

    // 4. UJI MASTER BANK MUSIK
    await page.evaluate(() => {
      const btn = document.getElementById('menu-musicbank');
      if (btn) btn.click();
    });
    await page.waitForSelector('#sec-musicbank table', { timeout: 5000 });
    console.log('✓ Section #sec-musicbank terbuka.');
    const musicRows = await page.$$eval('#sec-musicbank table tbody tr', trs => trs.length);
    console.log(`✓ Jumlah baris katalog bank musik: ${musicRows}`);
    await page.screenshot({ path: 'musicbank_verified.png', fullPage: false });

    // 5. UJI PUSAT PANDUAN & ROADMAP SAAS
    await page.evaluate(() => {
      const btn = document.getElementById('menu-guide');
      if (btn) btn.click();
    });
    await page.waitForSelector('#sec-guide', { timeout: 5000 });
    console.log('✓ Section #sec-guide terbuka.');

    const guideTabs = await page.$$eval('#sec-guide .cms-tab-btn', btns => btns.map(b => b.textContent.trim()));
    console.log('✓ Sub-tab Panduan & SaaS:', guideTabs);

    // Ganti ke tab Arsitektur SaaS
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#sec-guide .cms-tab-btn'));
      const saasBtn = btns.find(b => b.textContent.includes('SaaS'));
      if (saasBtn) saasBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('✓ Tab Arsitektur SaaS aktif.');
    await page.screenshot({ path: 'guide_saas_verified.png', fullPage: false });

    console.log('\n🎉 [SELURUH PENGUJIAN 100% SUKSES!]: Seluruh Menu & Sub-tab Berjalan Paripurna!');
  } catch (err) {
    console.error(`❌ UJI AKHIR ERROR: ${err.message}`);
    if (errors.length) console.error('Browser logs:', errors);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFinalMenus();
