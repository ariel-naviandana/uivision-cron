const cron = require('node-cron');
const { exec } = require('child_process');

// Konfigurasi
const MACRO_NAME = 'fomo_scanner_v3';
const UIVISION_HTML = 'file:///C:/coding/uivision-cron/uivision.html';
const TIMEZONE = 'Asia/Jakarta';
const KILL_WAIT_MS = 3000; // jeda setelah kill sebelum buka Chrome baru

function nowWIB() {
    return new Date().toLocaleString('id-ID', { timeZone: TIMEZONE });
}

// Matikan semua proses Chrome (termasuk UI.Vision yang berjalan sebagai ekstensi di dalamnya)
function killChrome() {
    return new Promise((resolve) => {
        exec('taskkill /F /IM chrome.exe /T', (error, stdout, stderr) => {
            if (error) {
                // Kode error 128 = tidak ada proses chrome yang berjalan, itu normal
                if (error.code === 128) {
                    console.log(`[${nowWIB()}] Tidak ada Chrome yang berjalan`);
                } else {
                    console.error(`[${nowWIB()}] Gagal kill Chrome:`, error.message);
                }
            } else {
                console.log(`[${nowWIB()}] Chrome lama dimatikan`);
            }
            setTimeout(resolve, KILL_WAIT_MS);
        });
    });
}

async function runUivision(macroName) {
    // 1. Pastikan Chrome lama sudah mati
    await killChrome();

    console.log(`[${nowWIB()}] >>> MENJALANKAN: ${macroName} <<<`);

    // 2. Buka Chrome baru
    const url = `${UIVISION_HTML}?macro=${macroName}&direct=1&closeRPA=1&closeBrowser=1&storage=xfile`;
    const flags = [
        '--new-window',
        '--start-maximized',
        '--window-size=1920,1080',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
    ].join(' ');

    exec(`start chrome ${flags} "${url}"`, (error) => {
        if (error) {
            console.error(`[${nowWIB()}] Error menjalankan ${macroName}:`, error.message);
        }
    });
}

// Setiap 5 menit: menit ke 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * *', () => {
    console.log(`\n[${nowWIB()}] [JADWAL] ${MACRO_NAME}`);
    runUivision(MACRO_NAME);
}, { timezone: TIMEZONE });

console.log('='.repeat(50));
console.log('✅ SCHEDULER AKTIF');
console.log(`   Macro  : ${MACRO_NAME}`);
console.log('   Jadwal : tiap 5 menit (menit 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)');
console.log(`   Zona   : ${TIMEZONE}`);
console.log('='.repeat(50));