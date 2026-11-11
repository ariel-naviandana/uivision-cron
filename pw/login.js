// pw/login.js — buka Chrome profil bot untuk login ke fomo.family (sekali saja)
// Login di jendela yang terbuka, lalu TUTUP jendelanya. Sesi tersimpan di browser.userDataDir.
const { loadPwConfig } = require('./config');
const { openBrowser } = require('./browser');

(async () => {
    const cfg = loadPwConfig();
    cfg.browser = { ...cfg.browser, headless: false, blockResources: false };
    console.log(`Profil Chrome: ${cfg.browser.userDataDir}`);
    console.log('Login ke fomo.family di jendela yang terbuka, lalu TUTUP jendelanya untuk selesai.');
    const context = await openBrowser(cfg);
    const page = context.pages()[0] || await context.newPage();
    await page.goto(cfg.profileUrl).catch(() => {});
    await new Promise((r) => context.on('close', r));
    console.log('Selesai. Sesi login tersimpan.');
    process.exit(0);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
