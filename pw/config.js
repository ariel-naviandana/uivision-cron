// pw/config.js — baca pengaturan versi Playwright dari folder config/
//   config/general.json  jadwal, browser, profil fomo, halaman awal, fitur yang dijalankan (run),
//                        dry run (dryRun.sell/ad/buy), folder & file log (output)
//   config/sell-ad.json  sell (TP / trailing) dan AD
//   config/buy.json      scanner buy (watchlist)
//   config/paths.json    selector (XPath)
//   config/timing.json   wait, retry, interval
// Folder config/ dibaca dari folder exe (kalau dijalankan sebagai .exe) atau folder project.
// Kalau folder config/ tidak ada, pw.config.json lama (satu file) masih dibaca.
const fs = require('fs');
const path = require('path');

const isExe = !['node.exe', 'node'].includes(path.basename(process.execPath).toLowerCase());
const BASE_DIR = isExe ? path.dirname(process.execPath) : path.join(__dirname, '..');

const DEFAULTS = {
    // Jadwal (padanan uivision.config.json versi UI.Vision)
    timezone: 'Asia/Jakarta',
    schedule: '*/15 * * * *', // cron mulai ulang run; '' = jalan terus tanpa jadwal
    // restartMode: "cron" = restart run/Chrome sesuai schedule
    //              "random" = restart setelah jeda acak restartMinMin - restartMaxMin menit (lebih natural)
    restartMode: 'cron',
    restartMinMin: 8,
    restartMaxMin: 15,
    runOnStart: true,         // langsung jalan saat start, tidak menunggu jadwal pertama
    restartBrowser: true,     // tutup & buka ulang Chrome tiap jadwal (padanan killChrome)
    restartWaitMs: 3000,      // jeda setelah Chrome ditutup (padanan killWaitMs)
    browser: {
        chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'C:\\chrome-profiles\\fomo-playwright',
        headless: false,
        blockResources: false,
        viewport: null, // null = ikut ukuran jendela (maximize); isi { width, height } untuk ukuran tetap / headless
    },
    profileName: 'VagueCoralJay',  // nama profil fomo (cukup ubah ini)
    // Halaman awal scan: detail coin apa saja (tanpa ?r=), posisi dibaca dari panel "Your positions"
    startTokenUrl: 'https://fomo.family/tokens/base/0xcbada732173e39521cdbe8bf59a6dc85a9fc7b8c',
    // Fitur yang dijalankan (config/general.json -> run). false = fitur dilewati total (beda dengan dry run)
    sellEnabled: true,
    adEnabled: true,
    buyEnabled: false,
    // Scanner buy (config/buy.json)
    buy: {
        dryRunBuy: true,
        unstarAfterBuy: true,   // unstar coin dari watchlist setelah berhasil beli
        unstarOnDryRun: true,   // saat dry run (klik Buy dilewati), coin tetap di-unstar
        scanIntervalMs: 10000,  // jeda antar scan watchlist (diberi variasi acak +-30%)
        standbyRandom: true,    // saat standby, pindah ke detail coin watchlist yang dipilih acak
        mismatchCooldownMs: 120000, // MC di detail tidak masuk range -> coin dilewati selama ini
        coins: [],              // [{ name, mcapMin, mcapMax, amount }], mcap boleh "40.7K" / "2.32M" / angka
    },
    dryRunSell: true,
    dryRunAd: true,
    tpCustom: {},
    exclude: [],
    showDust: true,       // true = posisi dust (kecil) ikut di-scan, false = tidak
    // Sell. minProfit (%):
    //   trail.enabled=false: dipakai sebagai TP, sell saat margin >= minProfit (atau tpCustom per coin)
    //   trail.enabled=true : trailing stop, sell hanya kalau margin saat itu >= minProfit (tpCustom tidak dipakai)
    minProfit: 20,
    //   start     : trailing mulai dihitung saat margin >= start (%)
    //   drop      : sell kalau margin turun >= drop POIN dari puncak (puncak 50, drop 10 -> sell di <= 40)
    trail: { enabled: false, start: 30, drop: 10 },
    adTrigger: -25,
    adMinAgeH: 6,
    adUseRsi: true,
    adRsiMax: 30,
    adMinOrderUsd: 0,     // minimum order manual (USD). 0 = otomatis dibaca dari tombol "Minimum amount $X"
    adBelowMin: 'skip',   // invested < minimum: 'skip' = AD dilewati, 'min' = beli sebesar minimum
    maxLoop: 0,
    scanIntervalMs: 6000,
    reloadEvery: 4,
    clickTries: 3,
    clickFailMax: 3,
    errPauseMs: 60000,
    output: {
        dir: 'C:\\uivision\\datasources',
        positionsFile: 'fomo_positions.csv',
        adLogFile: 'fomo_ad_log.csv',
        sellLogFile: 'fomo_sell_log.csv',
        trailFile: 'fomo_trail.csv',
        buyLogFile: 'fomo_buy_log.csv',      // puncak margin trailing stop per coin
    },
    wait: {
        startLoadMs: 5000,  // tunggu halaman awal termuat
        detailMs: 5000,     // tunggu detail coin termuat setelah klik baris posisi
        afterActionMs: 2000,
        clickTimeoutMs: 5000,
        elementTimeoutMs: 10000,
        rsiTimeoutMs: 4000,
        rsiTries: 6,
        navTimeoutMs: 45000,
    },
    selectors: {
        row: "(//a[@data-slot='hover-card-trigger'][contains(@href,'/tokens/')][.//div[contains(@class,'w-24')]])",
        dustButton: "//button[@data-slot='accordion-trigger'][starts-with(normalize-space(.),'Show dust')]",
        hideDustButton: "//button[@data-slot='accordion-trigger'][starts-with(normalize-space(.),'Hide dust')]",
        rowName: ".//div[contains(@class,'text-sm') and contains(@class,'truncate')]",
        rowValue: ".//div[contains(@class,'w-24')]",
        sellButton: "(//div[button[normalize-space(.)='Buy']]/button[normalize-space(.)='Sell'])[1]",
        sell100: "//fieldset//button[normalize-space(text())='100%']",
        sellConfirm: "//button[contains(@class,'bg-accent-primary') and starts-with(normalize-space(.),'Sell ')]",
        detailAge: "(//span[@title and @translate='no' and contains(@class,'text-xs') and contains(@class,'text-text-secondary') and contains(@class,'shrink-0')])[1]",
        detailMarketCap: "//div[normalize-space(text())='Market cap']/following-sibling::div[1]",
        detailInvested: "//div[normalize-space(text())='Invested']/following-sibling::div[1]",
        detailAvgEntry: "//div[normalize-space(text())='Avg entry']/following-sibling::div[1]",
        rsiFrame: "iframe[id^='tradingview']",
        rsiValue: "//div[@data-qa-id='legend-source-item'][contains(.,'RSI')]//div[@data-test-id-value-title='Plot']//div[contains(@class,'valueValue')]",
        buyInput: "(//input[@placeholder='0' and contains(@class,'flex-1')])[1]",
        buyButton: "//button[contains(@class,'bg-accent-primary') and starts-with(normalize-space(.),'Buy ')]",
        insufficientButton: "//button[contains(translate(normalize-space(.),'INSUFFICIENTBALANCE','insufficientbalance'),'insufficient balance')]",
        // ---- scanner buy (watchlist sidebar) ----
        buyTab: "(//div[button[normalize-space(.)='Sell']]/button[normalize-space(.)='Buy'])[1]",
        watchlistTab: '',          // tombol/tab untuk membuka watchlist di sidebar
        watchScroll: '',           // elemen sidebar yang bisa di-scroll (watchlist hanya merender baris yang terlihat)
        watchRow: '',              // semua baris coin di watchlist, contoh "(//div[...]//a[...])"
        watchRowName: '',          // relatif ke baris: nama coin
        watchRowMcap: '',          // relatif ke baris: teks market cap, contoh "$16.1M MC"
        watchRowClick: './/img',   // relatif ke baris: yang diklik untuk membuka detail coin
        unstarButton: '',          // di halaman detail: tombol bintang untuk unstar (hapus dari watchlist)
        minOrderButton: "//button[contains(translate(normalize-space(.),'MINIMUM','minimum'),'minimum')]",
    },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, over) {
    const out = { ...base };
    for (const [k, v] of Object.entries(over || {})) {
        out[k] = isObj(v) && isObj(base[k]) && k !== 'tpCustom' ? merge(base[k], v) : v;
    }
    return out;
}

const CONFIG_FILES = ['general.json', 'sell-ad.json', 'buy.json', 'paths.json', 'timing.json'];

function readJson(file) {
    try {
        const v = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`Config dibaca: ${file}`);
        return v;
    } catch (e) {
        console.log(`Config tidak ditemukan/rusak: ${file} (${e.message}), pakai nilai bawaan`);
        return {};
    }
}

// Gabungkan file-file di config/ jadi satu objek dengan bentuk yang sama seperti DEFAULTS
function readUserConfig() {
    const dir = path.join(BASE_DIR, 'config');
    if (!fs.existsSync(dir)) {
        // kompatibel: config lama satu file
        return readJson(path.join(BASE_DIR, 'pw.config.json'));
    }
    const [general, sellAd, buy, paths, timingAll] = CONFIG_FILES.map((f) => readJson(path.join(dir, f)));
    // timing.json: jeda khusus buy dipetakan ke cfg.buy
    const { buyScanIntervalMs, buyMismatchCooldownMs, ...timing } = timingAll;
    if (buyScanIntervalMs !== undefined) buy.scanIntervalMs = buyScanIntervalMs;
    if (buyMismatchCooldownMs !== undefined) buy.mismatchCooldownMs = buyMismatchCooldownMs;
    const { run, dryRun, ...gen } = general;
    const user = { ...gen, ...sellAd, ...paths, ...timing };
    if (run) {
        if (run.sell !== undefined) user.sellEnabled = run.sell;
        if (run.ad !== undefined) user.adEnabled = run.ad;
        if (run.buy !== undefined) user.buyEnabled = run.buy;
    }
    if (Object.keys(buy).length) user.buy = buy;
    if (dryRun) {
        if (dryRun.sell !== undefined) user.dryRunSell = dryRun.sell;
        if (dryRun.ad !== undefined) user.dryRunAd = dryRun.ad;
        if (dryRun.buy !== undefined) user.buy = { ...(user.buy || {}), dryRunBuy: dryRun.buy };
    }
    return user;
}

function loadPwConfig() {
    const user = readUserConfig();
    const cfg = merge(DEFAULTS, user);
    if (Array.isArray(user.buy?.coins)) cfg.buy.coins = user.buy.coins; // array: ganti, bukan digabung
    // URL halaman awal lengkap = startTokenUrl + ?r=profileName
    cfg.startUrl = `${String(cfg.startTokenUrl).split('?')[0]}?r=${encodeURIComponent(String(cfg.profileName).trim())}`;
    // kompatibel dengan config lama (wait.profileLoadMs). profileUrl lama sengaja diabaikan:
    // selector baris sekarang untuk panel "Your positions" di halaman detail coin, bukan profil.
    if (user.wait && user.wait.startLoadMs == null && user.wait.profileLoadMs != null) cfg.wait.startLoadMs = user.wait.profileLoadMs;
    require('./util').setTimezone(cfg.timezone);
    // normalisasi daftar nama (huruf kecil) untuk pencocokan
    cfg.excludeSet = new Set((cfg.exclude || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean));
    cfg.tpMap = Object.fromEntries(Object.entries(cfg.tpCustom || {})
        .map(([k, v]) => [String(k).trim().toLowerCase(), Number(v)])
        .filter(([, v]) => Number.isFinite(v)));
    // daftar coin buy: key nama huruf kecil
    cfg.buyMap = new Map((cfg.buy.coins || [])
        .filter((c) => c && c.name)
        .map((c) => [String(c.name).trim().toLowerCase(), {
            name: String(c.name).trim(),
            mcapMin: require('./util').money(c.mcapMin),   // "40.7K" -> 40700
            mcapMax: require('./util').money(c.mcapMax),
            amount: Number(c.amount),
        }]));
    return cfg;
}

module.exports = { loadPwConfig, BASE_DIR };
