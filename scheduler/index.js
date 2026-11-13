const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Folder tempat exe berada. Kalau dijalankan lewat "node index.js", pakai folder script.
const isExe = path.basename(process.execPath).toLowerCase() !== 'node.exe';
// uivision.config.json ada di root project (folder di atas scheduler/), atau di folder exe
const BASE_DIR = isExe ? path.dirname(process.execPath) : path.join(__dirname, '..');

// Nilai bawaan kalau uivision.config.json tidak ada atau ada key yang kosong
const defaults = {
    macroName: 'fomo_scanner',
    uivisionHtml: 'file:///C:/coding/fomo-scanner/uivision.html',
    timezone: 'Asia/Jakarta',
    schedule: '*/5 * * * *',
    killWaitMs: 3000,
    killChrome: true,
    runOnStart: true,
};

let cfg = { ...defaults };
// uivision.config.json (nama lama config.json masih dibaca kalau yang baru belum ada)
const configPath = [path.join(BASE_DIR, 'uivision.config.json'), path.join(BASE_DIR, 'config.json')]
    .find((p) => fs.existsSync(p)) || path.join(BASE_DIR, 'uivision.config.json');
try {
    cfg = { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
    console.log(`Config dibaca dari: ${configPath}`);
} catch (e) {
    console.log(`uivision.config.json tidak ditemukan/rusak di ${configPath}, pakai nilai bawaan`);
}

if (!cron.validate(cfg.schedule)) {
    console.error(`Format cron tidak valid: "${cfg.schedule}"`);
    process.exit(1);
}

function nowWIB() {
    return new Date().toLocaleString('id-ID', { timeZone: cfg.timezone });
}

function killChrome() {
    return new Promise((resolve) => {
        exec('taskkill /F /IM chrome.exe /T', (error) => {
            if (error) {
                if (error.code === 128) {
                    console.log(`[${nowWIB()}] Tidak ada Chrome yang berjalan`);
                } else {
                    console.error(`[${nowWIB()}] Gagal kill Chrome:`, error.message);
                }
            } else {
                console.log(`[${nowWIB()}] Chrome lama dimatikan`);
            }
            setTimeout(resolve, cfg.killWaitMs);
        });
    });
}

async function runUivision(macroName) {
    if (cfg.killChrome) await killChrome();

    console.log(`[${nowWIB()}] >>> MENJALANKAN: ${macroName} <<<`);

    const url = `${cfg.uivisionHtml}?macro=${macroName}&direct=1&closeRPA=1&closeBrowser=1&storage=xfile`;
    const flags = [
        '--new-window',
        '--start-maximized',
        '--window-size=1920,1080',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        '--disable-session-crashed-bubble',
        '--hide-crash-restore-bubble',
    ].join(' ');

    exec(`start chrome ${flags} "${url}"`, (error) => {
        if (error) console.error(`[${nowWIB()}] Error menjalankan ${macroName}:`, error.message);
    });
}

cron.schedule(cfg.schedule, () => {
    console.log(`\n[${nowWIB()}] [JADWAL] ${cfg.macroName}`);
    runUivision(cfg.macroName);
}, { timezone: cfg.timezone });

console.log('='.repeat(50));
console.log('✅ SCHEDULER AKTIF');
console.log(`   Macro  : ${cfg.macroName}`);
console.log(`   Jadwal : ${cfg.schedule}`);
console.log(`   HTML   : ${cfg.uivisionHtml}`);
console.log(`   Zona   : ${cfg.timezone}`);
console.log(`   Kill Chrome: ${cfg.killChrome ? 'ya' : 'tidak'}`);
console.log(`   Run saat start: ${cfg.runOnStart ? 'ya' : 'tidak'}`);
console.log('='.repeat(50));

// Jalankan sekali langsung saat start, run berikutnya tetap mengikuti cron
if (cfg.runOnStart) {
    console.log(`\n[${nowWIB()}] [STARTUP] ${cfg.macroName}`);
    runUivision(cfg.macroName);
}