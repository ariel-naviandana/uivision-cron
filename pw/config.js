// pw/config.js — baca pw.config.json (pengaturan versi Playwright fomo scanner)
// File dibaca dari folder exe (kalau dijalankan sebagai .exe) atau folder project.
const fs = require('fs');
const path = require('path');

const isExe = !['node.exe', 'node'].includes(path.basename(process.execPath).toLowerCase());
const BASE_DIR = isExe ? path.dirname(process.execPath) : path.join(__dirname, '..');

const DEFAULTS = {
    // Jadwal (padanan config.json versi UI.Vision)
    timezone: 'Asia/Jakarta',
    schedule: '*/15 * * * *', // cron mulai ulang run; '' = jalan terus tanpa jadwal
    runOnStart: true,         // langsung jalan saat start, tidak menunggu jadwal pertama
    restartBrowser: true,     // tutup & buka ulang Chrome tiap jadwal (padanan killChrome)
    restartWaitMs: 3000,      // jeda setelah Chrome ditutup (padanan killWaitMs)
    browser: {
        chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'C:\\chrome-profiles\\fomo-playwright',
        headless: false,
        blockResources: false,
        viewport: { width: 1600, height: 1000 },
    },
    profileName: 'VagueCoralJay',  // nama profil fomo (cukup ubah ini)
    // Halaman awal scan: detail coin apa saja (tanpa ?r=), posisi dibaca dari panel "Your positions"
    startTokenUrl: 'https://fomo.family/tokens/solana/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    dryRunSell: true,
    dryRunAd: true,
    tp: 20,
    tpCustom: {},
    exclude: [],
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
    },
    wait: {
        startLoadMs: 5000,  // tunggu halaman awal termuat
        detailMs: 5000,     // tunggu detail coin termuat setelah klik baris posisi
        afterActionMs: 2000,
        clickTimeoutMs: 5000,
        elementTimeoutMs: 10000,
        rsiTimeoutMs: 4000,
        rsiTries: 3,
        navTimeoutMs: 45000,
    },
    selectors: {
        row: "(//a[@data-slot='hover-card-trigger'][contains(@href,'/tokens/')][.//div[contains(@class,'w-24')]])",
        dustButton: "//button[@data-slot='accordion-trigger'][starts-with(normalize-space(.),'Show dust')]",
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

function loadPwConfig() {
    const file = path.join(BASE_DIR, 'pw.config.json');
    let user = {};
    try {
        user = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`Config dibaca dari: ${file}`);
    } catch (e) {
        console.log(`pw.config.json tidak ditemukan/rusak di ${file} (${e.message}), pakai nilai bawaan`);
    }
    const cfg = merge(DEFAULTS, user);
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
    return cfg;
}

module.exports = { loadPwConfig, BASE_DIR };
