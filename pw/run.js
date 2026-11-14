// pw/run.js — Fomo scanner (sell TP & average down) versi Playwright
// Pengganti macro UI.Vision fomo_scanner + scheduler index.js.
//   restartMode : "cron" = mulai ulang run sesuai schedule, "random" = jeda acak restartMinMin-restartMaxMin menit
//   schedule    : cron untuk memulai ulang run (padanan "schedule" di uivision.config.json).
//                 Kosong ("") = satu run jalan terus tanpa jadwal.
//   runOnStart  : langsung jalan saat start.
//   restartBrowser : tiap jadwal Chrome ditutup & dibuka ulang (padanan "killChrome").
// Setiap run baru dimulai dengan state baru (daftar coin yang sudah di-AD & hitungan gagal-klik
// di-reset), sama seperti macro yang dijalankan ulang oleh scheduler lama.
// Run lama dihentikan dengan rapi: transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong.
// Dua tab: tab 1 = sell & AD (panel Your positions), tab 2 = buy (watchlist). Fitur yang jalan diatur
// di config/general.json -> run { sell, ad, buy }.
const cron = require('node-cron');
const { loadPwConfig } = require('./config');
const { openBrowser } = require('./browser');
const { FomoScanner } = require('./scanner');
const { BuyScanner } = require('./buyer');
const { log, sleep, nowTs } = require('./util');

const cfg = loadPwConfig();
const RANDOM = String(cfg.restartMode).toLowerCase() === 'random';
const hasSchedule = RANDOM || !!cfg.schedule;

// Restart acak: setelah setiap restart, jeda berikutnya diacak lagi
function scheduleRandomRestart() {
    const min = Math.max(1, Number(cfg.restartMinMin) || 8);
    const max = Math.max(min, Number(cfg.restartMaxMin) || 15);
    const ms = Math.round((min + Math.random() * (max - min)) * 60000);
    const at = new Date(Date.now() + ms);
    log(`Restart berikutnya dalam ${(ms / 60000).toFixed(1)} menit (acak ${min}-${max} menit), sekitar ${nowTs(at).slice(11)}`);
    setTimeout(async () => {
        await startRun('JADWAL ACAK');
        scheduleRandomRestart();
    }, ms);
}

let context = null;
let page = null;
let buyPage = null;
let scanner = null;
let buyer = null;
let runPromise = null;
let closing = false;   // true saat browser sengaja ditutup (restart / berhenti)
let busy = false;      // true saat proses ganti run sedang berlangsung

async function ensureBrowser() {
    if (context) return;
    context = await openBrowser(cfg);
    page = context.pages()[0] || await context.newPage();
    if (cfg.buyEnabled) buyPage = await context.newPage();
    context.on('close', () => {
        context = null;
        page = null;
        buyPage = null;
        if (closing) return;
        log('Browser tertutup tanpa diminta. Dibuka ulang di jadwal berikutnya'
            + (hasSchedule ? '' : ' (tanpa jadwal: bot berhenti, jalankan ulang npm run pw)'), 'err');
        if (scanner) scanner.stopped = true;
        if (buyer) buyer.stopped = true;
        if (!hasSchedule) process.exit(1);
    });
}

async function closeBrowser() {
    if (!context) return;
    closing = true;
    await context.close().catch(() => {});
    context = null;
    page = null;
    buyPage = null;
    closing = false;
}

async function stopRun() {
    if (!scanner && !buyer) return;
    if (scanner) scanner.stopped = true;
    if (buyer) buyer.stopped = true;
    if (runPromise) {
        log('Menunggu siklus yang sedang berjalan selesai...');
        await runPromise.catch(() => {});
    }
    scanner = null;
    buyer = null;
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
        const jobs = [];
        if (cfg.sellEnabled !== false || cfg.adEnabled !== false) {
            scanner = new FomoScanner(page, cfg);
            jobs.push(scanner.run().catch((e) => log(`Run sell/AD berhenti karena error: ${e.message}`, 'err')));
        }
        if (cfg.buyEnabled) {
            if (!buyPage) buyPage = await context.newPage();
            buyer = new BuyScanner(buyPage, cfg);
            jobs.push(buyer.run().catch((e) => log(`Run buy berhenti karena error: ${e.message}`, 'err')));
        }
        if (!jobs.length) log('Semua fitur (sell, ad, buy) dimatikan di config/general.json -> run', 'warn');
        runPromise = Promise.all(jobs);
    } catch (e) {
        log(`Gagal memulai run: ${e.message}`, 'err');
    } finally {
        busy = false;
    }
}

async function shutdown() {
    log('Menghentikan bot...');
    if (scanner) scanner.stopped = true;
    if (buyer) buyer.stopped = true;
    await closeBrowser();
    process.exit(0);
}

(async () => {
    console.log('='.repeat(56));
    console.log('✅ FOMO SCANNER (Playwright) AKTIF');
    console.log(`   Halaman awal: ${cfg.startUrl}`);
    console.log(`   Jadwal      : ${RANDOM ? `restart acak tiap ${cfg.restartMinMin}-${cfg.restartMaxMin} menit` : (cfg.schedule || 'tanpa jadwal (jalan terus)')} | zona ${cfg.timezone}`);
    console.log(`   Run saat start: ${cfg.runOnStart ? 'ya' : 'tidak'} | restart Chrome tiap jadwal: ${cfg.restartBrowser ? 'ya' : 'tidak'}`);
    console.log(`   Chrome      : ${cfg.browser.userDataDir} (headless: ${cfg.browser.headless ? 'ya' : 'tidak'})`);
    const t = cfg.trail;
    console.log(`   Sell        : ${t.enabled ? `trailing mulai ${t.start}% | turun ${t.drop} poin | min profit ${cfg.minProfit}%` : `TP ${cfg.minProfit}% (minProfit)${Object.keys(cfg.tpMap).length ? ` | custom ${JSON.stringify(cfg.tpCustom)}` : ''}`} | ${cfg.sellEnabled === false ? 'NONAKTIF' : cfg.dryRunSell ? 'DRY RUN' : 'JUAL BENERAN'}`);
    console.log(`   AD          : margin <= ${cfg.adTrigger}% | umur >= ${cfg.adMinAgeH}h | RSI ${cfg.adUseRsi ? `<= ${cfg.adRsiMax}` : 'tidak dipakai'} | ${cfg.adEnabled === false ? 'NONAKTIF' : cfg.dryRunAd ? 'DRY RUN' : 'BELI BENERAN'}`);
    console.log(`   Buy         : ${cfg.buyEnabled ? `${cfg.buyMap.size} coin dipantau | ${cfg.buy.dryRunBuy ? 'DRY RUN' : 'BELI BENERAN'}` : 'NONAKTIF'}`);
    console.log(`   Exclude     : ${cfg.exclude.length ? cfg.exclude.join(', ') : '-'}`);
    console.log(`   Output      : ${cfg.output.dir}`);
    console.log('='.repeat(56));

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (RANDOM) {
        if (cfg.runOnStart) await startRun('STARTUP');
        scheduleRandomRestart();
    } else if (cfg.schedule) {
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
