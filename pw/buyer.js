// pw/buyer.js — scanner buy: pantau watchlist (sidebar fomo) di tab kedua
// Coin di watchlist yang terdaftar di config/buy.json dicek market cap-nya (dibaca dari sidebar).
// Kalau market cap masuk range [mcapMin, mcapMax] -> buka detail coin, beli sebesar amount,
// lalu unstar supaya coin hilang dari watchlist (tidak terbeli dua kali).
// Sebelum Buy, market cap dicek ulang di halaman detail (kotak Market cap): sidebar kadang glitch.
// Saat standby, tab pindah ke detail coin watchlist yang dipilih acak (lebih natural).
// Log: fomo_buy_log.csv (waktu, nama, mcap sidebar, mcap detail, mcapMin, mcapMax, nominal, hasil)
//   hasil: DRY_RUN_STOP / DRY_RUN_STOP_UNSTAR_GAGAL / BOUGHT / BOUGHT_UNSTAR_GAGAL / BUY_GAGAL / BUY_MISMATCH /
//          BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / DETAIL_MISMATCH / MCAP_TIDAK_COCOK
const { log, sleep, nowTs, money, appendCsv, rand, jitter } = require('./util');
const { FomoScanner } = require('./scanner');

// selector wajib di config/paths.json supaya scanner buy bisa jalan
const REQUIRED = ['watchRow', 'watchRowName', 'watchRowMcap'];
// selectors.watchScroll (opsional): elemen sidebar yang bisa di-scroll, supaya semua coin watchlist terbaca

class BuyScanner {
    constructor(page, cfg) {
        this.page = page;
        this.cfg = cfg;
        this.sel = cfg.selectors;
        this.out = cfg.output;
        this.b = cfg.buy;
        this.needOpen = true;
        this.sinceOpen = 0;
        this.done = new Set();   // coin yang sudah diproses di run ini (beli / dry run / gagal permanen)
        this.failMap = {};       // hitungan gagal-klik per coin
        this.cooldown = {};      // coin yang dilewati sementara: { until, reason } (MC tidak cocok, saldo kurang, dll.)
        this.curDetail = -1;     // market cap di halaman detail (untuk log)
        this.total = 0;
        this.stopped = false;
        this.warnedMissing = false;
    }

    async wait(ms) {
        const end = Date.now() + ms;
        while (!this.stopped && Date.now() < end) await sleep(Math.min(500, end - Date.now()));
    }

    x(q) {
        return this.page.locator(`xpath=${q}`);
    }

    async text(locator, timeout) {
        try {
            return ((await locator.first().textContent({ timeout })) || '').replace(/\s+/g, ' ').trim();
        } catch {
            return null;
        }
    }

    async open() {
        await this.page.goto(this.cfg.startUrl, { waitUntil: 'domcontentloaded' });
        await sleep(this.cfg.wait.startLoadMs);
        // Buka sidebar watchlist. Selector hanya cocok kalau watchlist belum aktif (aria-pressed bukan true),
        // jadi kalau sudah terbuka tidak diklik lagi (klik ulang bisa menutupnya).
        if (this.sel.watchlistTab) {
            const tab = this.x(this.sel.watchlistTab).first();
            if (await tab.count().catch(() => 0)) {
                await tab.click({ timeout: this.cfg.wait.clickTimeoutMs })
                    .catch(() => log('[BUY] Tab watchlist tidak bisa diklik', 'warn'));
                await sleep(1500);
            }
        }
        this.needOpen = false;
        this.sinceOpen = 0;
    }

    logBuy(ts, c, mcap, result) {
        appendCsv(this.out.dir, this.out.buyLogFile, [ts, c.name, mcap, this.curDetail, c.mcapMin, c.mcapMax, c.amount, result]);
    }

    // ---------- Satu siklus scan watchlist ----------
    async cycle() {
        this.total++;
        const missing = REQUIRED.filter((k) => !this.sel[k]);
        if (missing.length) {
            if (!this.warnedMissing) {
                log(`[BUY] Selector belum diisi di config/paths.json: ${missing.join(', ')}. Scanner buy menunggu`, 'warn');
                this.warnedMissing = true;
            }
            await this.wait(60000);
            return;
        }
        if (this.cfg.buyMap.size === 0) {
            if (!this.warnedMissing) log('[BUY] Belum ada coin di config/buy.json -> coins. Scanner buy menunggu', 'warn');
            this.warnedMissing = true;
            await this.wait(60000);
            return;
        }

        if (this.sinceOpen >= this.cfg.reloadEvery) this.needOpen = true;
        if (this.needOpen) await this.open();
        else this.sinceOpen++;

        // Watchlist fomo hanya merender baris yang terlihat (virtual list), jadi sidebar di-scroll
        // dari atas sampai bawah dan setiap baris dibaca sekali (key = link coin).
        const rows = this.x(this.sel.watchRow);
        await rows.first().waitFor({ state: 'attached', timeout: this.cfg.wait.elementTimeoutMs }).catch(() => {});
        const scroller = this.sel.watchScroll ? this.x(this.sel.watchScroll).first() : null;
        const canScroll = scroller && await scroller.count().catch(() => 0);
        if (canScroll) await scroller.evaluate((el) => { el.scrollTop = 0; }).catch(() => {});
        await sleep(300);

        const seen = new Set();
        let acted = false;
        for (let pass = 0; pass < 50 && !acted && !this.stopped; pass++) {
            const n = await rows.count().catch(() => 0);
            for (let i = 0; i < n && !acted && !this.stopped; i++) {
                const row = rows.nth(i);
                const href = await row.getAttribute('href', { timeout: 2000 }).catch(() => null);
                const name = await this.text(row.locator(`xpath=${this.sel.watchRowName}`), 3000);
                if (!name) continue;
                const id = href || name;
                if (seen.has(id)) continue;
                seen.add(id);

                const key = name.toLowerCase();
                const c = this.cfg.buyMap.get(key);
                if (!c) continue; // coin di watchlist tapi tidak ada di config: diabaikan

                const mcapText = await this.text(row.locator(`xpath=${this.sel.watchRowMcap}`), 3000);
                const mcap = money(mcapText);
                const inRange = mcap > 0 && mcap >= c.mcapMin && mcap <= c.mcapMax;
                log(`[BUY] ${name} | MC ${mcap} | range ${c.mcapMin} - ${c.mcapMax} | ${inRange ? 'MASUK RANGE' : 'di luar range'}`,
                    inRange ? 'ok' : 'info');
                if (!inRange) continue;

                if (this.done.has(key)) {
                    log(`[BUY] ${name} dilewati: sudah diproses di run ini`);
                    continue;
                }
                if ((this.failMap[key] || 0) >= this.cfg.clickFailMax) {
                    log(`[BUY] ${name} dilewati: gagal diklik >= ${this.cfg.clickFailMax} kali`, 'warn');
                    continue;
                }
                const cd = this.cooldown[key];
                if (cd && cd.until > Date.now()) {
                    log(`[BUY] ${name} dilewati sementara (${cd.reason}), dicoba lagi ${Math.ceil((cd.until - Date.now()) / 1000)} detik lagi`);
                    continue;
                }

                // baris dicari ulang lewat link-nya: virtual list bisa merender ulang / menggeser urutan baris
                const target = href ? this.x(`${this.sel.watchRow}[@href="${href}"]`).first() : row;
                await this.doBuy(target, key, c, mcap);
                this.needOpen = true; // halaman sudah pindah ke detail coin
                acted = true;
            }
            if (acted || !canScroll) break;
            // scroll ke bawah; berhenti kalau sudah mentok
            const moved = await scroller.evaluate((el) => {
                const before = el.scrollTop;
                el.scrollTop = before + Math.max(100, el.clientHeight * 0.8);
                return el.scrollTop !== before;
            }).catch(() => false);
            if (!moved) break;
            await sleep(600);
        }
        if (!acted) {
            log(`[BUY] Siklus #${this.total} | ${seen.size} coin di watchlist dicek`);
            if (seen.size === 0) this.needOpen = true;
            else if (this.b.standbyRandom !== false) await this.standby();
        }

        await this.wait(jitter(Number(this.b.scanIntervalMs) || 10000));
    }

    // ---------- Standby: pindah ke detail coin watchlist acak ----------
    // Klik baris watchlist (bukan buka URL) supaya sidebar watchlist tetap terbuka.
    async standby() {
        const rows = this.x(this.sel.watchRow);
        const n = await rows.count().catch(() => 0);
        const cur = this.page.url();
        const options = [];
        for (let i = 0; i < n; i++) {
            const href = await rows.nth(i).getAttribute('href', { timeout: 1000 }).catch(() => null);
            if (href && !cur.includes(href.split('?')[0])) options.push(href);
        }
        if (!options.length) return;
        const href = options[Math.floor(Math.random() * options.length)];
        const row = this.x(`${this.sel.watchRow}[@href="${href}"]`).first();
        const name = await this.text(row.locator(`xpath=${this.sel.watchRowName}`), 2000);
        await sleep(Math.round(rand(400, 1500)));
        try {
            const target = this.sel.watchRowClick ? row.locator(`xpath=${this.sel.watchRowClick}`).first() : row;
            await target.click({ timeout: this.cfg.wait.clickTimeoutMs });
            log(`[BUY] Standby di ${name || href}`);
            this.needOpen = false;
        } catch {
            /* tidak apa-apa, tetap di halaman sekarang */
        }
    }

    // Coin dilewati sementara, dicoba lagi setelah ms (bukan dikunci sampai run berikutnya)
    setCooldown(key, ms, reason) {
        this.cooldown[key] = { until: Date.now() + ms, reason };
    }

    // ---------- Beli satu coin ----------
    async doBuy(row, key, c, mcap) {
        const W = this.cfg.wait;
        const ts = nowTs();
        this.curDetail = -1;
        log(`[BUY] ${c.name}: market cap ${mcap} masuk range, beli $${c.amount}`, 'ok');

        if (!(c.amount > 0)) {
            log(`[BUY] ${c.name}: amount di config tidak valid (${c.amount})`, 'err');
            this.done.add(key);
            this.logBuy(ts, c, mcap, 'AMOUNT_TIDAK_VALID');
            return;
        }

        // buka detail coin dari baris watchlist
        const href = await row.getAttribute('href', { timeout: 2000 }).catch(() => null)
            || await row.locator('xpath=.//a[contains(@href,"/tokens/")]').first().getAttribute('href', { timeout: 2000 }).catch(() => null);
        await sleep(Math.round(rand(300, 1200)));
        let clicked = false;
        for (let t = 1; t <= this.cfg.clickTries && !clicked; t++) {
            try {
                const target = this.sel.watchRowClick ? row.locator(`xpath=${this.sel.watchRowClick}`).first() : row;
                await target.click({ timeout: W.clickTimeoutMs });
                clicked = true;
            } catch {
                log(`[BUY] Klik ${c.name} gagal, coba lagi... (${t}/${this.cfg.clickTries})`, 'warn');
                await sleep(1500);
            }
        }
        if (!clicked) {
            this.failMap[key] = (this.failMap[key] || 0) + 1;
            this.logBuy(ts, c, mcap, 'CLICK_GAGAL');
            return;
        }
        this.failMap[key] = 0;

        if (href) {
            const p = href.split('?')[0];
            await this.page.waitForURL((u) => u.toString().includes(p), { timeout: W.elementTimeoutMs }).catch(() => {});
        }
        await sleep(W.detailMs);
        if (href && !this.page.url().includes(href.split('?')[0])) {
            log(`[BUY] Halaman detail ${c.name} tidak terbuka (url: ${this.page.url()})`, 'err');
            this.logBuy(ts, c, mcap, 'DETAIL_MISMATCH');
            return;
        }

        // cek ulang market cap di halaman detail (MC di sidebar kadang glitch)
        await this.x(this.sel.detailMarketCap).first().waitFor({ timeout: W.elementTimeoutMs }).catch(() => {});
        this.curDetail = money(await this.text(this.x(this.sel.detailMarketCap), W.elementTimeoutMs));
        if (!(this.curDetail > 0 && this.curDetail >= c.mcapMin && this.curDetail <= c.mcapMax)) {
            log(`[BUY] ${c.name} dibatalkan: MC di detail ${this.curDetail} tidak masuk range ${c.mcapMin} - ${c.mcapMax} `
                + `(sidebar ${mcap})`, 'warn');
            this.setCooldown(key, Number(this.b.mismatchCooldownMs) || 120000, 'MC detail tidak cocok');
            this.logBuy(ts, c, mcap, 'MCAP_TIDAK_COCOK');
            return;
        }
        log(`[BUY] ${c.name}: MC di detail ${this.curDetail} cocok`, 'ok');

        // pastikan tab Buy aktif, isi nominal, baca tombol
        await this.x(this.sel.buyTab).first().click({ timeout: W.clickTimeoutMs }).catch(() => {});
        await sleep(500);
        let buyText = null;
        try {
            await this.x(this.sel.buyInput).first().fill(String(c.amount), { timeout: W.elementTimeoutMs });
            await sleep(1000);
            buyText = await this.text(this.x(this.sel.buyButton), W.elementTimeoutMs);
        } catch { /* dicek di bawah */ }

        if (!buyText) {
            const minText = await this.text(this.x(this.sel.minOrderButton), 1500);
            if (minText) {
                log(`[BUY] ${c.name} dibatalkan: nominal $${c.amount} di bawah minimum (${minText})`, 'warn');
                this.setCooldown(key, Number(this.b.retryCooldownMs) || 60000, 'di bawah minimum order');
                this.logBuy(ts, c, mcap, 'BUY_MIN_ORDER');
                return;
            }
            const balText = await this.text(this.x(this.sel.insufficientButton), 1500);
            if (balText) {
                log(`[BUY] ${c.name} dibatalkan: saldo tidak cukup untuk beli $${c.amount}`, 'warn');
                this.setCooldown(key, Number(this.b.retryCooldownMs) || 60000, 'saldo kurang');
                this.logBuy(ts, c, mcap, 'BUY_SALDO_KURANG');
                return;
            }
        }
        if (!FomoScanner.actionMatch(buyText, 'Buy', c.name)) {
            log(`[BUY] Tombol buy tidak cocok (${buyText}), ${c.name} dibatalkan`, 'err');
            this.setCooldown(key, Number(this.b.retryCooldownMs) || 60000, 'tombol Buy tidak cocok');
            this.logBuy(ts, c, mcap, 'BUY_MISMATCH');
            return;
        }

        let result;
        if (this.b.dryRunBuy) {
            // dry run: hanya klik Buy yang dilewati, unstar tetap jalan
            log(`[BUY] DRY RUN: tidak klik '${buyText}' (nominal $${c.amount})`
                + (this.b.unstarAfterBuy && this.b.unstarOnDryRun !== false ? ', lanjut unstar' : ''), 'warn');
            result = 'DRY_RUN_STOP';
        } else {
            try {
                await this.x(this.sel.buyButton).first().click({ timeout: W.elementTimeoutMs });
            } catch {
                await sleep(W.afterActionMs);
                log(`[BUY] BUY GAGAL: ${c.name} (tombol Buy tidak bisa diklik)`, 'err');
                this.logBuy(ts, c, mcap, 'BUY_GAGAL');
                return;
            }
            await sleep(W.afterActionMs);
            log(`[BUY] BOUGHT: ${c.name} senilai $${c.amount} (MC ${mcap})`, 'ok');
            result = 'BOUGHT';
        }
        this.done.add(key);

        // unstar setelah beli; saat dry run hanya kalau unstarOnDryRun = true
        const doUnstar = this.b.unstarAfterBuy && (!this.b.dryRunBuy || this.b.unstarOnDryRun !== false);
        if (doUnstar) {
            if (!this.sel.unstarButton) {
                log('[BUY] selectors.unstarButton belum diisi, coin tidak di-unstar', 'warn');
                result += '_UNSTAR_GAGAL';
            } else {
                try {
                    await sleep(Math.round(rand(300, 1000)));
                    await this.x(this.sel.unstarButton).first().click({ timeout: W.clickTimeoutMs });
                    await sleep(1000);
                    log(`[BUY] ${c.name} di-unstar dari watchlist`, 'ok');
                } catch {
                    log(`[BUY] ${c.name} gagal di-unstar, hapus manual dari watchlist`, 'err');
                    result += '_UNSTAR_GAGAL';
                }
            }
        }
        this.logBuy(ts, c, mcap, result);
    }

    async run() {
        log(`[BUY] Scanner buy aktif: ${this.cfg.buyMap.size} coin dipantau | ${this.b.dryRunBuy ? 'DRY RUN' : 'BELI BENERAN'}`);
        while (!this.stopped && (this.cfg.maxLoop === 0 || this.total < this.cfg.maxLoop)) {
            try {
                await this.cycle();
            } catch (e) {
                log(`[BUY] Error siklus: ${e.message}`, 'err');
                this.needOpen = true;
                await this.wait(5000);
            }
        }
        log(`[BUY] Run selesai (${this.total} siklus)`, 'ok');
    }
}

module.exports = { BuyScanner };
