// pw/login.js — login ke fomo.family (sekali saja) memakai profil Chrome bot
// Chrome dibuka BIASA (tanpa Playwright/remote debugging), karena Google menolak login
// dari browser yang dikendalikan otomatis ("This browser or app may not be secure").
// Sesi login tersimpan di browser.userDataDir dan dipakai bot saat jalan.
const fs = require('fs');
const { spawn } = require('child_process');
const { loadPwConfig } = require('./config');

const cfg = loadPwConfig();
const { chromePath, userDataDir } = cfg.browser;

fs.mkdirSync(userDataDir, { recursive: true });
console.log(`Profil Chrome: ${userDataDir}`);
console.log('Login ke fomo.family di jendela Chrome yang terbuka.');
console.log('Setelah selesai, TUTUP semua jendela Chrome tersebut, lalu jalankan bot.');
console.log('Pastikan bot (npm run pw / fomo-pw.exe) sedang TIDAK jalan saat login.');

const child = spawn(chromePath, [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    cfg.profileUrl,
], { stdio: 'ignore' });

child.on('error', (e) => {
    console.error(`Gagal membuka Chrome (${chromePath}): ${e.message}`);
    process.exit(1);
});
child.on('exit', () => {
    console.log('Chrome ditutup. Sesi login tersimpan.');
    process.exit(0);
});
