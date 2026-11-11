// pw/browser.js — buka Chrome asli dengan profil khusus bot (sesi login fomo tersimpan)
const path = require('path');
const { createRequire } = require('module');

// Saat jalan sebagai .exe (Node SEA), modul luar tidak bisa di-require langsung.
// playwright-core diambil dari folder node_modules di samping exe.
function loadPlaywright() {
    try {
        return require('playwright-core');
    } catch {
        const base = path.dirname(process.execPath);
        return createRequire(path.join(base, 'index.js'))('playwright-core');
    }
}
const { chromium } = loadPlaywright();

const BLOCK_TYPES = new Set(['media', 'font']);

async function openBrowser(cfg) {
    const b = cfg.browser;
    const context = await chromium.launchPersistentContext(b.userDataDir, {
        executablePath: b.chromePath,
        headless: !!b.headless,
        viewport: b.viewport,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-background-timer-throttling',
            '--no-first-run',
            '--no-default-browser-check',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
    });
    // Gambar tetap dimuat: icon coin dipakai untuk diklik
    if (b.blockResources) {
        await context.route('**/*', (route) => (
            BLOCK_TYPES.has(route.request().resourceType()) ? route.abort() : route.continue()
        ));
    }
    context.setDefaultTimeout(cfg.wait.elementTimeoutMs);
    context.setDefaultNavigationTimeout(cfg.wait.navTimeoutMs);
    return context;
}

module.exports = { openBrowser };
