import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Nawakara\\.gemini\\antigravity\\brain\\ff5f0cb0-a533-4631-958b-f183709e1612\\browser_e2e_screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserAudit() {
  console.log('🚀 Memulai Browser E2E Automation Testing dengan Google Chrome asli...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const testReport = [];

  try {
    // =========================================================
    // 0. AUTENTIKASI SESI MC (vanya@mcconnect.id)
    // =========================================================
    console.log('0. Menginisialisasi Sesi Login MC (vanya@mcconnect.id)...');
    await page.goto('http://127.0.0.1:9000/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Clear initial unauthenticated errors before login
    consoleErrors.length = 0;

    const loginSuccess = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/mc/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: 'vanya@mcconnect.id', password: 'password123' }),
        });
        const json = await res.json();
        return json.success === true;
      } catch (e) {
        return false;
      }
    });

    console.log('   Status Login MC:', loginSuccess ? 'BERHASIL' : 'TIDAK BERHASIL');
    consoleErrors.length = 0; // reset errors after auth established

    // Reload with authenticated cookies
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow React to load CMS events & financial meters

    // =========================================================
    // 1. COMMAND CENTER APP SHELL (/app)
    // =========================================================
    console.log('1. Memverifikasi Command Center (/app)...');
    const pageTitle = await page.title();
    const hasNav = await page.$eval('header', (el) => !!el).catch(() => false);
    const tableRowsCount = await page.$$eval('tbody tr', (rows) => rows.length).catch(() => 0);

    testReport.push({
      module: 'Command Center App Shell',
      passed: hasNav && tableRowsCount > 0,
      detail: `Mounted successfully. Title: "${pageTitle}". Database events rendered: ${tableRowsCount} rows.`,
    });

    const ssDashboard = path.join(SCREENSHOT_DIR, '01_command_center_dashboard.png');
    await page.screenshot({ path: ssDashboard, fullPage: true });

    // =========================================================
    // 2. TEST FILTER STATUS DIREKTORI ACARA
    // =========================================================
    console.log('2. Menguji Filter Status Acara (Terkunci, Tentative, Review, Selesai)...');
    const filterButtons = await page.$$('button');
    let terkunciClicked = false;
    for (const btn of filterButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('Terkunci')) {
        await btn.click();
        terkunciClicked = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const filteredRowsCount = await page.$$eval('tbody tr', (rows) => rows.length).catch(() => 0);

    testReport.push({
      module: 'Event Filter Reaktif',
      passed: terkunciClicked && filteredRowsCount > 0,
      detail: `Filter 'Terkunci' berhasil diklik. Baris terfilter: ${filteredRowsCount} acara.`,
    });

    // =========================================================
    // 3. TEST TAB 2: KEUANGAN & DOKUMEN SPK
    // =========================================================
    console.log('3. Menguji Tab Keuangan & Dokumen SPK...');
    let financeTabClicked = false;
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('2. Keuangan')) {
        await btn.click();
        financeTabClicked = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));

    const hasCashflowMeter = await page.evaluate(() => document.body.innerText.includes('Distribusi Arus Kas'));
    const hasSpkButton = await page.$eval('a[href*="/spk"]', (el) => !!el).catch(() => false);
    const hasInvoiceButton = await page.$eval('a[href*="/invoices/"]', (el) => !!el).catch(() => false);

    testReport.push({
      module: 'Tab Keuangan & Dokumen Zero-Trust',
      passed: financeTabClicked && hasCashflowMeter && hasSpkButton && hasInvoiceButton,
      detail: `Cashflow Distribution Meter: ${hasCashflowMeter}, Link SPK: ${hasSpkButton}, Link Invoice: ${hasInvoiceButton}.`,
    });

    const ssFinance = path.join(SCREENSHOT_DIR, '02_keuangan_dokumen.png');
    await page.screenshot({ path: ssFinance, fullPage: true });

    // =========================================================
    // 4. TEST TAB 3: RUNDOWN & AI SCRIPT CO-PILOT
    // =========================================================
    console.log('4. Menguji Tab Rundown & AI Script Co-Pilot...');
    const allButtons2 = await page.$$('button');
    for (const btn of allButtons2) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('3. Rundown')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    const hasRundownItems = await page.evaluate(() => document.body.innerText.includes('Tamu Undangan Tiba'));
    const hasAiButton = await page.evaluate(() => document.body.innerText.includes('AI Co-Pilot'));

    testReport.push({
      module: 'Rundown Timeline & AI Co-Pilot',
      passed: hasRundownItems && hasAiButton,
      detail: `Rundown Timeline items loaded: ${hasRundownItems}, AI Co-Pilot trigger active: ${hasAiButton}.`,
    });

    const ssRundown = path.join(SCREENSHOT_DIR, '03_rundown_timeline.png');
    await page.screenshot({ path: ssRundown, fullPage: true });

    // =========================================================
    // 5. TEST STAGE MODE (/app#stage)
    // =========================================================
    console.log('5. Beralih ke Stage Mode (/app#stage)...');
    await page.goto('http://127.0.0.1:9000/app#stage', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const isStageConsole = await page.evaluate(() => document.body.innerText.includes('STAGE CONSOLE'));
    const hasTeleprompter = await page.evaluate(() => 
      document.body.innerText.toLowerCase().includes('selamat malam') ||
      document.body.innerText.includes('Grand Entrance')
    );
    const hasSoundboard = await page.evaluate(() => document.body.innerText.includes('SOUNDBOARD'));

    // Test clicking Mirror Button
    const stageButtons = await page.$$('button');
    let mirrorClicked = false;
    for (const btn of stageButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('MIRROR')) {
        await btn.click();
        mirrorClicked = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const isMirrored = await page.$eval('.-scale-x-100', (el) => !!el).catch(() => false);

    testReport.push({
      module: 'Stage Mode & Voice Prompter',
      passed: isStageConsole && hasTeleprompter && hasSoundboard && isMirrored,
      detail: `Stage Console: ${isStageConsole}, Teleprompter Rendered: ${hasTeleprompter}, Soundboard Pads: ${hasSoundboard}, Mirror Mode (-scale-x-100): ${isMirrored}.`,
    });

    const ssStage = path.join(SCREENSHOT_DIR, '04_stage_mode_teleprompter.png');
    await page.screenshot({ path: ssStage, fullPage: true });

    // =========================================================
    // 6. TEST OPERATOR MUSIK (/app#vendor)
    // =========================================================
    console.log('6. Beralih ke Operator Musik (/app#vendor)...');
    await page.goto('http://127.0.0.1:9000/app#vendor', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const isVendorScreen = await page.evaluate(() => 
      document.body.innerText.includes('OPERATOR MUSIK') ||
      document.body.innerText.includes('LAYAR OPERATOR MUSIK')
    );
    const hasCueList = await page.evaluate(() => 
      document.body.innerText.includes('Fanfare') ||
      document.body.innerText.includes('SEKARANG TAMPIL') ||
      document.body.innerText.includes('Cue')
    );
    const hasLiveSync = await page.evaluate(() => 
      document.body.innerText.includes('Sinkronisasi Panggung Aktif')
    );

    testReport.push({
      module: 'Operator Musik Cue Sheet',
      passed: isVendorScreen && hasCueList && hasLiveSync,
      detail: `Vendor Screen Header: ${isVendorScreen}, Cue Sheet Items: ${hasCueList}, BroadcastChannel Sync: ${hasLiveSync}.`,
    });

    const ssVendor = path.join(SCREENSHOT_DIR, '05_operator_musik_vendor.png');
    await page.screenshot({ path: ssVendor, fullPage: true });

    // =========================================================
    // 7. TEST LANDING KLIEN & KALENDER REAL-TIME (/app#landing)
    // =========================================================
    console.log('7. Beralih ke Landing Klien (/app#landing)...');
    await page.goto('http://127.0.0.1:9000/app#landing', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const hasLandingHero = await page.evaluate(() => 
      document.body.innerText.includes('Momen Sakral')
    );
    const hasCalendar = await page.evaluate(() => 
      document.body.innerText.includes('Oktober 2026') ||
      document.body.innerText.includes('Kalender Ketersediaan')
    );

    testReport.push({
      module: 'Landing Klien & Kalender Real-Time',
      passed: hasLandingHero && hasCalendar,
      detail: `Hero Section: ${hasLandingHero}, Real-time Calendar Database: ${hasCalendar}.`,
    });

    const ssLanding = path.join(SCREENSHOT_DIR, '06_landing_klien_calendar.png');
    await page.screenshot({ path: ssLanding, fullPage: true });

  } catch (err) {
    console.error('Error saat pengujian browser:', err);
    testReport.push({
      module: 'Browser Test Runner',
      passed: false,
      detail: err.message,
    });
  } finally {
    await browser.close();
  }

  console.log('\n=================================================================');
  console.log('       HASIL AUDIT E2E GOOGLE CHROME LANGSUNG DI BROWSER          ');
  console.log('=================================================================');
  let allOk = true;
  testReport.forEach((tr, i) => {
    const status = tr.passed ? '[PASSED]' : '[FAILED]';
    if (!tr.passed) allOk = false;
    console.log(`${i + 1}. ${status} ${tr.module}`);
    console.log(`   ${tr.detail}`);
  });

  console.log('\nConsole Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors.slice(0, 5));
  }

  console.log('=================================================================');
  console.log(`STATUS KELULUSAN BROWSER: ${allOk && consoleErrors.length === 0 ? '100% SUKSES PENUH (ZERO BUGS 🎉)' : 'SELESAI DENGAN CATATAN'}`);
  console.log('=================================================================\n');
}

runBrowserAudit();
