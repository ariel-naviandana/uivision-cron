// pw/scanner.js — port Playwright dari macro UI.Vision fomo_scanner_v3
// Alur per siklus: buka profil (kalau perlu) -> scroll muat semua posisi -> scan tiap coin:
//   - margin >= TP coin            -> SELL (Sell -> 100% -> konfirmasi "Sell <nama>")
//   - margin <= adTrigger (belum ada aksi) -> cek AD di halaman detail (umur, RSI, MC < avg, invested)
//                                            -> kalau lolos: isi nominal = invested, Buy
// Log CSV sama dengan macro: fomo_positions.csv, fomo_sell_log.csv, fomo_ad_log.csv
const { log, sleep, nowTs, money, margin, ageHours, appendCsv } = require('./util');

class FomoScanner {
    constructor(page, cfg) {
        this.page = page;
        this.cfg = cfg;
        this.sel = cfg.selectors;
        this.out = cfg.output;
        this.needOpen = true;
        this.sinceOpen = 0;
        this.resumeK = 1;
        this.adDone = new Set();   // coin yang sudah di-AD di run ini (maks 1x per coin)
        this.failMap = {};         // hitungan gagal-klik per coin
        this.pageFail = 0;
        this.total = 0;
        this.iter = 0;
        this.stopped = false;
    }

    // sleep yang berhenti lebih awal kalau run dihentikan (jadwal berikutnya / Ctrl+C)
    async wait(ms) {
        const end = Date.now() + ms;
        while (!this.stopped && Date.now() < end) await sleep(Math.min(500, end - Date.now()));
    }

    x(q) {
        return this.page.locator(`xpath=${q}`);
    }

    rowLoc(k) {
        return this.x(`${this.sel.row}[${k}]`);
    }

    async text(locator, timeout) {
        try {
            return ((await locator.first().textContent({ timeout })) || '').replace(/\s+/g, ' ').trim();
        } catch {
            return null;
        }
    }

    tpFor(name) {
        const v = this.cfg.tpMap[name.toLowerCase()];
        return Number.isFinite(v) ? v : Number(this.cfg.tp);
    }

    async openProfile() {
        await this.page.goto(this.cfg.profileUrl, { waitUntil: 'domcontentloaded' });
        await sleep(this.cfg.wait.profileLoadMs);
        this.needOpen = false;
        this.sinceOpen = 0;
    }

    // Scroll sampai jumlah baris tidak bertambah (maks 8 kali). Return null kalau halaman bermasalah.
    async loadAllRows() {
        const rows = this.x(this.sel.row);
        let cnt;
        try {
            cnt = await rows.count();
        } catch {
            return null;
        }
        let last = -1;
        for (let sc = 0; sc < 8 && cnt !== last; sc++) {
            last = cnt;
            if (cnt > 0) {
                await this.rowLoc(cnt).scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
                await this.page.keyboard.press('End').catch(() => {});
            }
            await sleep(1500);
            cnt = await rows.count().catch(() => cnt);
        }
        return cnt;
    }

    // Klik icon coin di baris k, dicoba clickTries kali
    async clickRowIcon(k, name) {
        for (let t = 1; t <= this.cfg.clickTries; t++) {
            try {
                await this.rowLoc(k).locator('xpath=.//img').first().click({ timeout: this.cfg.wait.clickTimeoutMs });
                return true;
            } catch {
                log(`Klik icon ${name} gagal, coba lagi... (${t}/${this.cfg.clickTries})`, 'warn');
                await sleep(1500);
            }
        }
        return false;
    }

    markFail(name, ok) {
        const key = name.toLowerCase();
        this.failMap[key] = ok ? 0 : (this.failMap[key] || 0) + 1;
    }

    logSell(ts, name, nominal, pct, result) {
        appendCsv(this.out.dir, this.out.sellLogFile, [ts, name, nominal, pct, result]);
    }

    // ---------- SELL ----------
    async doSell(k, ts, name, nominal, pct, tp) {
        const W = this.cfg.wait;
        log(`SELL: ${name} (${pct}% >= TP ${tp}%)`, 'ok');
        this.needOpen = true;

        if (!(await this.clickRowIcon(k, name))) {
            log(`COIN TIDAK BISA DIKLIK: ${name}. Dilewati`, 'err');
            this.markFail(name, false);
            this.logSell(ts, name, nominal, pct, 'CLICK_GAGAL');
            this.resumeK = k + 1;
            return;
        }
        this.markFail(name, true);

        let flowOk = true;
        let finalText = null;
        try {
            await sleep(W.popupMs);
            await this.x(this.sel.sellButton).first().click({ timeout: W.elementTimeoutMs });
            await sleep(500);
            await this.x(this.sel.sell100).first().click({ timeout: W.elementTimeoutMs });
            await sleep(500);
            finalText = await this.text(this.x(this.sel.sellConfirm), W.elementTimeoutMs);
        } catch {
            flowOk = false;
        }

        if (!(flowOk && finalText === `Sell ${name}`)) {
            log(`Coin di popup tidak cocok (${finalText}), sell dibatalkan`, 'err');
            this.logSell(ts, name, nominal, pct, 'MISMATCH');
            this.resumeK = k + 1;
            return;
        }

        if (this.cfg.dryRunSell) {
            log(`DRY RUN: berhenti sebelum klik '${finalText}'`, 'warn');
            this.logSell(ts, name, nominal, pct, 'DRY_RUN_STOP');
            this.resumeK = k + 1;
            return;
        }

        let clicked = true;
        try {
            await this.x(this.sel.sellConfirm).first().click({ timeout: W.elementTimeoutMs });
        } catch {
            clicked = false;
        }
        await sleep(W.afterActionMs);
        if (clicked) {
            log(`SOLD: ${name} (${pct}%)`, 'ok');
            this.logSell(ts, name, nominal, pct, 'SOLD');
            this.resumeK = k; // coin terjual hilang dari list, coin berikutnya menempati nomor yang sama
        } else {
            log(`SELL GAGAL: ${name} (tombol konfirmasi tidak bisa diklik)`, 'err');
            this.logSell(ts, name, nominal, pct, 'SELL_GAGAL');
            this.resumeK = k + 1;
        }
    }

    // ---------- AD (average down) ----------
    async readRsi() {
        const W = this.cfg.wait;
        const frame = this.page.frameLocator(this.sel.rsiFrame).first();
        for (let t = 0; t < W.rsiTries; t++) {
            const txt = await this.text(frame.locator(`xpath=${this.sel.rsiValue}`), W.rsiTimeoutMs);
            const n = parseFloat(txt);
            if (Number.isFinite(n)) return n;
            await sleep(1000);
        }
        return -1;
    }

    async doAd(k, ts, name, pct) {
        const W = this.cfg.wait;
        const d = { ageH: -1, mcNow: -1, avgMC: -1, invested: -1, rsi: -1, result: 'POPUP_MISMATCH' };
        log(`KANDIDAT AD: ${name} (${pct}%) -> cek detail coin`, 'warn');

        if (!(await this.clickRowIcon(k, name))) {
            log(`COIN TIDAK BISA DIKLIK: ${name}. AD dibatalkan`, 'err');
            this.markFail(name, false);
            d.result = 'CLICK_GAGAL';
        } else {
            this.markFail(name, true);
            await sleep(W.popupMs);
            const popName = await this.text(this.x(this.sel.popupName), W.elementTimeoutMs);

            if (popName !== name) {
                log(`Popup coin tidak cocok (${popName}), AD dibatalkan`, 'err');
            } else {
                try {
                    await this.x(this.sel.popupIcon).first().click({ timeout: W.elementTimeoutMs });
                } catch { /* lanjut, pembacaan detail akan gagal kalau halaman tidak terbuka */ }
                await sleep(W.detailMs);
                await this.x(this.sel.detailMarketCap).first().waitFor({ timeout: W.elementTimeoutMs }).catch(() => {});

                d.ageH = ageHours(await this.text(this.x(this.sel.detailAge), 3000));
                d.mcNow = money(await this.text(this.x(this.sel.detailMarketCap), 3000));
                d.invested = money(await this.text(this.x(this.sel.detailInvested), 3000));
                d.avgMC = money(await this.text(this.x(this.sel.detailAvgEntry), 3000));
                if (this.cfg.adUseRsi) d.rsi = await this.readRsi();

                const fail = [];
                if (!(d.ageH >= this.cfg.adMinAgeH)) fail.push('UMUR');
                if (this.cfg.adUseRsi && !(d.rsi >= 0 && d.rsi <= this.cfg.adRsiMax)) fail.push('RSI');
                if (!(d.mcNow > 0 && d.avgMC > 0 && d.mcNow < d.avgMC)) fail.push('MC');
                if (!(d.invested > 0)) fail.push('INVESTED');
                d.result = fail.length ? `TIDAK_LOLOS:${fail.join('+')}` : 'LOLOS';

                log(`AD CEK ${name}: umur=${d.ageH}h (min ${this.cfg.adMinAgeH}) | RSI=${d.rsi} (maks ${this.cfg.adRsiMax}) | `
                    + `MC=${d.mcNow} vs avg=${d.avgMC} | invested=${d.invested} | hasil=${d.result}`, 'warn');

                if (d.result === 'LOLOS') {
                    await this.buyAd(name, d);
                } else {
                    log(`AD ${name} belum memenuhi syarat, dicek lagi di putaran berikutnya`, 'warn');
                }
            }
        }

        appendCsv(this.out.dir, this.out.adLogFile, [ts, name, d.ageH, d.rsi, d.mcNow, d.avgMC, d.invested, d.result]);

        // kembali ke profil, lanjut dari coin berikutnya
        await this.openProfile().catch(() => { this.needOpen = true; });
        this.resumeK = k + 1;
    }

    async buyAd(name, d) {
        const W = this.cfg.wait;
        let buyText = null;
        let flowOk = true;
        try {
            await this.x(this.sel.buyInput).first().fill(String(d.invested), { timeout: W.elementTimeoutMs });
            await sleep(1000);
            buyText = await this.text(this.x(this.sel.buyButton), W.elementTimeoutMs);
        } catch {
            flowOk = false;
        }

        if (!(flowOk && buyText === `Buy ${name}`)) {
            log(`Tombol buy tidak cocok (${buyText}), AD dibatalkan`, 'err');
            d.result = 'BUY_MISMATCH';
            return;
        }
        if (this.cfg.dryRunAd) {
            log(`DRY RUN: berhenti sebelum klik '${buyText}' (nominal ${d.invested})`, 'warn');
            d.result = 'DRY_RUN_STOP';
            return;
        }
        try {
            await this.x(this.sel.buyButton).first().click({ timeout: W.elementTimeoutMs });
            await sleep(W.afterActionMs);
            log(`AD BUY: ${name} senilai $${d.invested}`, 'ok');
            d.result = 'BOUGHT';
            this.adDone.add(name);
        } catch {
            await sleep(W.afterActionMs);
            log(`BUY GAGAL: ${name} (tombol Buy tidak bisa diklik)`, 'err');
            d.result = 'BUY_GAGAL';
        }
    }

    // ---------- Satu siklus ----------
    async cycle() {
        this.total++;
        log(`=== Siklus #${this.total} | ${this.iter}/${this.cfg.maxLoop || '∞'} ===`);

        if (this.sinceOpen >= this.cfg.reloadEvery) this.needOpen = true;
        try {
            if (this.needOpen) {
                await this.openProfile();
            } else {
                log('Tidak pindah halaman, scan ulang di halaman yang sama');
                this.sinceOpen++;
            }
        } catch (e) {
            log(`Gagal membuka profil: ${e.message}`, 'err');
        }

        const n = await this.loadAllRows();
        if (n === null) {
            this.pageFail++;
            log(`HALAMAN FOMO BERMASALAH. Kegagalan berturut-turut: ${this.pageFail}. `
                + `Menunggu ${this.cfg.errPauseMs} ms lalu memuat ulang profil`, 'err');
            this.needOpen = true;
            await this.wait(this.cfg.errPauseMs);
            return;
        }
        this.pageFail = 0;
        log(`${n} posisi terbaca`);
        if (n === 0) {
            log('0 posisi terbaca, profil dimuat ulang di siklus berikutnya', 'warn');
            this.needOpen = true;
        }

        log(`Scan mulai dari coin ke-${this.resumeK}`);
        let acted = false;

        for (let k = this.resumeK; k <= n && !acted && !this.stopped; k++) {
            const row = this.rowLoc(k);
            const name = await this.text(row.locator(`xpath=${this.sel.rowName}`), 3000);
            if (!name) {
                log(`Gagal membaca nama coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, 'err');
                this.needOpen = true;
                acted = true;
                this.resumeK = k + 1;
                break;
            }

            const key = name.toLowerCase();
            if (this.cfg.excludeSet.has(key) || (this.failMap[key] || 0) >= this.cfg.clickFailMax) {
                log(`SKIP: ${name} (ada di exclude atau gagal diklik >= ${this.cfg.clickFailMax} kali)`);
                continue;
            }

            const colText = await this.text(row.locator(`xpath=${this.sel.rowValue}`), 3000);
            if (colText === null) {
                log(`Gagal membaca margin coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, 'err');
                this.needOpen = true;
                acted = true;
                this.resumeK = k + 1;
                break;
            }

            const nominal = money(colText);
            const pct = margin(colText);
            const tp = this.tpFor(name);
            const ts = nowTs();
            log(`${name} | $${nominal} | ${pct}% | TP ${tp}%`, 'ok');
            appendCsv(this.out.dir, this.out.positionsFile, [ts, name, nominal, pct]);

            if (pct >= tp) {
                acted = true;
                await this.doSell(k, ts, name, nominal, pct, tp);
            } else if (pct <= this.cfg.adTrigger) {
                if (this.adDone.has(name)) {
                    log(`Kandidat AD ${name} (${pct}%) dilewati: sudah pernah di-AD pada run ini`, 'warn');
                } else {
                    acted = true;
                    await this.doAd(k, ts, name, pct);
                }
            }
        }

        if (!acted) {
            log('Tidak ada aksi di scan ini', 'ok');
            this.resumeK = 1;
            await this.wait(this.cfg.scanIntervalMs);
        }
        this.iter++;
    }

    async run() {
        while (!this.stopped && (this.cfg.maxLoop === 0 || this.iter < this.cfg.maxLoop)) {
            try {
                await this.cycle();
            } catch (e) {
                log(`Error siklus: ${e.message}`, 'err');
                this.needOpen = true;
                await this.wait(5000);
            }
        }
        log(`Run selesai (${this.total} siklus)`, 'ok');
    }
}

module.exports = { FomoScanner };
