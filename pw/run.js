// pw/run.js — Fomo scanner (sell TP & average down) versi Playwright
// Pengganti macro UI.Vision fomo_scanner + scheduler index.js.
//   schedule    : cron untuk memulai ulang run (padanan "schedule" di config.json lama).
//                 Kosong ("") = satu run jalan terus tanpa jadwal.
//   runOnStart  : langsung jalan saat start.
//   restartBrowser : tiap jadwal Chrome ditutup & dibuka ulang (padanan "killChrome").
// Setiap run baru dimulai dengan state baru (daftar coin yang sudah di-AD & hitungan gagal-klik
// di-reset), sama seperti macro yang dijalankan ulang oleh scheduler lama.
// Run lama dihentikan dengan rapi: transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong.
const cron = require('node-cron');
const { loadPwConfig } = require('./config');
const { openBrowser } = require('./browser');
const { FomoScanner } = require('./scanner');
const { log, sleep } = require('./util');

const cfg = loadPwConfig();

let context = null;
let page = null;
let scanner = null;
let runPromise = null;
let closing = false;   // true saat browser sengaja ditutup (restart / berhenti)
let busy = false;      // true saat proses ganti run sedang berlangsung

async function ensureBrowser() {
    if (context) return;
    context = await openBrowser(cfg);
    page = context.pages()[0] || await context.newPage();
    context.on('close', () => {
        context = null;
        page = null;
        if (closing) return;
        log('Browser tertutup tanpa diminta. Dibuka ulang di jadwal berikutnya'
            + (cfg.schedule ? '' : ' (tanpa jadwal: bot berhenti, jalankan ulang npm run pw)'), 'err');
        if (scanner) scanner.stopped = true;
        if (!cfg.schedule) process.exit(1);
    });
}

async function closeBrowser() {
    if (!context) return;
    closing = true;
    await context.close().catch(() => {});
    context = null;
    page = null;
    closing = false;
}

async function stopRun() {
    if (!scanner) return;
    scanner.stopped = true;
    if (runPromise) {
        log('Menunggu siklus yang sedang berjalan selesai...');
        await runPromise.catch(() => {});
    }
    scanner = null;
    runPromise = null;
}

async function startRun(reason) {
    if (busy) {
        log(`[${reason}] Pergantian run sebelumnya belum selesai, jadwal ini dilewati`, 'warn');
        return;
    }
    busy = true;
    try {
        log(`[${reason}] >>> MULAI RUN FOMO SCANNER <<<`, 'ok');
        await stopRun();
        if (cfg.restartBrowser && context) {
            await closeBrowser();
            log('Chrome lama ditutup');
            await sleep(cfg.restartWaitMs);
        }
        await ensureBrowser();
        scanner = new FomoScanner(page, cfg);
        const current = scanner;
        runPromise = current.run().catch((e) => log(`Run berhenti karena error: ${e.message}`, 'err'));
    } catch (e) {
        log(`Gagal memulai run: ${e.message}`, 'err');
    } finally {
        busy = false;
    }
}

async function shutdown() {
    log('Menghentikan bot...');
    if (scanner) scanner.stopped = true;
    await closeBrowser();
    process.exit(0);
}

(async () => {
    console.log('='.repeat(56));
    console.log('✅ FOMO SCANNER (Playwright) AKTIF');
    console.log(`   Halaman awal: ${cfg.startUrl}`);
    console.log(`   Jadwal      : ${cfg.schedule || 'tanpa jadwal (jalan terus)'} | zona ${cfg.timezone}`);
    console.log(`   Run saat start: ${cfg.runOnStart ? 'ya' : 'tidak'} | restart Chrome tiap jadwal: ${cfg.restartBrowser ? 'ya' : 'tidak'}`);
    console.log(`   Chrome      : ${cfg.browser.userDataDir} (headless: ${cfg.browser.headless ? 'ya' : 'tidak'})`);
    const t = cfg.trail;
    console.log(`   Sell        : ${t.enabled ? `trailing mulai ${t.start}% | turun ${t.drop} poin | min profit ${cfg.minProfit}%` : `TP ${cfg.minProfit}% (minProfit)${Object.keys(cfg.tpMap).length ? ` | custom ${JSON.stringify(cfg.tpCustom)}` : ''}`} | ${cfg.sellEnabled === false ? 'NONAKTIF' : cfg.dryRunSell ? 'DRY RUN' : 'JUAL BENERAN'}`);
    console.log(`   AD          : margin <= ${cfg.adTrigger}% | umur >= ${cfg.adMinAgeH}h | RSI ${cfg.adUseRsi ? `<= ${cfg.adRsiMax}` : 'tidak dipakai'} | ${cfg.adEnabled === false ? 'NONAKTIF' : cfg.dryRunAd ? 'DRY RUN' : 'BELI BENERAN'}`);
    console.log(`   Exclude     : ${cfg.exclude.length ? cfg.exclude.join(', ') : '-'}`);
    console.log(`   Output      : ${cfg.output.dir}`);
    console.log('='.repeat(56));

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (cfg.schedule) {
        if (!cron.validate(cfg.schedule)) {
            console.error(`Format cron tidak valid: "${cfg.schedule}"`);
            process.exit(1);
        }
        cron.schedule(cfg.schedule, () => startRun('JADWAL'), { timezone: cfg.timezone });
        if (cfg.runOnStart) await startRun('STARTUP');
        else log(`Menunggu jadwal pertama (${cfg.schedule})`);
    } else {
        // Tanpa jadwal: satu run jalan terus sampai maxLoop / Ctrl+C
        await startRun('STARTUP');
        await runPromise;
        await closeBrowser();
        process.exit(0);
    }
})().catch((e) => {
    console.error('Gagal start:', e);
    process.exit(1);
});
