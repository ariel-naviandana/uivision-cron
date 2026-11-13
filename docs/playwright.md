# Fomo Scanner versi Playwright

Port dari macro UI.Vision `fomo_scanner_v4` (`macros/fomo_scanner_v4.json`) (sell saat TP dan average down/AD) ke Playwright.
Kode lama tetap: `npm start` (`scheduler/index.js`) masih menjalankan scheduler UI.Vision seperti biasa.

## Menjalankan
```
npm install          sekali (memasang playwright-core, tanpa download browser)
npm run pw:login     sekali: login ke fomo.family di jendela yang terbuka, lalu tutup jendelanya
npm run pw           jalankan scanner sesuai jadwal (berhenti dengan Ctrl+C)
```
Atau pakai exe (cara build ada di `docs/build-exe.md`): `fomo-pw.exe` untuk jalan, `fomo-pw.exe login` untuk login.
Exe butuh `pw.config.json` dan `node_modules\playwright-core` di folder yang sama.

Jangan jalankan `npm start` (UI.Vision) dan `npm run pw` bersamaan: dua-duanya bertransaksi di akun yang sama.

## Jadwal
Sama seperti scheduler lama: tiap `schedule` (default tiap 15 menit) run dimulai ulang dengan state baru
(daftar coin yang sudah di-AD dan hitungan gagal-klik di-reset). Bedanya, run lama dihentikan dengan rapi:
transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong di tengah seperti kill Chrome.

## Pengaturan: `pw.config.json`
| Key | Arti | Di macro |
|---|---|---|
| `timezone` | Zona waktu jadwal & log | config.json `timezone` |
| `schedule` | Cron untuk memulai ulang run (`""` = jalan terus tanpa jadwal) | config.json `schedule` |
| `runOnStart` | Langsung jalan saat start | config.json `runOnStart` |
| `restartBrowser` | Tutup & buka ulang Chrome tiap jadwal | config.json `killChrome` |
| `restartWaitMs` | Jeda setelah Chrome ditutup | config.json `killWaitMs` |
| `profileName` | Nama profil fomo, contoh `VagueCoralJay` (dipakai sebagai `?r=` di URL) | PROFILE_NAME |
| `startTokenUrl` | Halaman awal scan: detail coin apa saja tanpa `?r=`, posisi dibaca dari panel "Your positions" | START_TOKEN_URL |
| `dryRunSell` | `true` = berhenti sebelum klik konfirmasi Sell | DRY_RUN_SELL |
| `dryRunAd` | `true` = isi nominal tapi tidak klik Buy | DRY_RUN_AD |
| `tpCustom` | TP khusus per coin, menggantikan `minProfit` untuk coin itu (hanya saat trailing mati). Nama tidak peka huruf besar/kecil. Contoh `{ "E/ACC": 10, "COLLECTOOOR": 30 }`, kosong `{}` | TP_CUSTOM (`E/ACC:10\|COLLECTOOOR:30`) |
| `trail.enabled` | `true` = sell pakai trailing stop (`tpCustom` tidak dipakai). `false` = sell saat margin >= `minProfit` (seperti TP) | USE_TRAIL |
| `trail.start` | Trailing mulai saat margin >= nilai ini (%) | TRAIL_START |
| `trail.drop` | Sell kalau margin turun >= sekian POIN dari puncak (puncak 50, drop 10 -> sell di <= 40) | TRAIL_DROP |
| `minProfit` | Trailing: sell hanya kalau margin saat itu >= nilai ini. Tanpa trailing: dipakai sebagai TP (%) | MIN_PROFIT |
| `exclude` | Coin yang dilewati total (tidak di-sell/AD). Nama tidak peka huruf besar/kecil. Contoh `["E/ACC", "GATO"]`, kosong `[]` | EXCLUDE (`E/ACC\|GATO`) |
| `adTrigger` | Margin (%) yang memicu cek AD (margin <= nilai ini) | AD_TRIGGER |
| `adMinAgeH` | Umur coin minimal (jam) untuk AD | AD_MIN_AGE_H |
| `adUseRsi` / `adRsiMax` | RSI jadi syarat AD / RSI maksimal | AD_USE_RSI / AD_RSI_MAX |
| `adMinOrderUsd` | Minimum order manual (USD). `0` = otomatis dari tombol "Minimum amount $X" | - |
| `adBelowMin` | Invested < minimum: `"skip"` = AD dilewati (BUY_MIN_ORDER), `"min"` = beli sebesar minimum | - |
| `maxLoop` | Batas jumlah siklus, 0 = terus | MAX_LOOP |
| `scanIntervalMs` | Jeda antar scan kalau tidak ada aksi | SCAN_INTERVAL |
| `reloadEvery` | Reload halaman awal paksa tiap N scan | RELOAD_EVERY |
| `clickTries` / `clickFailMax` | Percobaan klik icon / auto-skip coin yang sering gagal diklik | CLICK_TRIES / CLICK_FAIL_MAX |
| `errPauseMs` | Jeda setelah halaman fomo bermasalah | ERR_PAUSE |
| `output.*` | Folder dan nama file log CSV | CSV_FILE, AD_LOG_FILE, SELL_LOG_FILE, TRAIL_FILE |
| `browser.*` | Lokasi Chrome, folder profil bot, headless, viewport (`null` = ikut ukuran jendela, maximize) | - |
| `wait.*` | Waktu tunggu (ms) halaman awal, detail coin, klik, RSI, navigasi | pause di macro |
| `selectors.*` | XPath/CSS elemen fomo (ubah di sini kalau tampilan fomo berubah) | XPath di macro |

Sebelum scan, tombol "Show dust (N)" diklik kalau list dust masih tertutup (`selectors.dustButton`).

Syarat AD sama dengan macro: umur >= `adMinAgeH`, RSI <= `adRsiMax` (kalau dipakai),
market cap sekarang < avg entry, invested > 0. Nominal buy = invested (1:1). Maks 1x AD per coin per run.
Kalau tombol Buy berubah jadi "Insufficient balance" (saldo tidak cukup), AD dibatalkan dan dicatat BUY_SALDO_KURANG.

## Log (format sama dengan macro)
- `fomo_positions.csv`: waktu, nama, nominal, margin
- `fomo_sell_log.csv`: waktu, nama, nominal, margin, hasil (DRY_RUN_STOP / SOLD / SELL_GAGAL / MISMATCH / CLICK_GAGAL / SELL_MIN_ORDER)
- `fomo_ad_log.csv`: waktu, nama, umur(jam), rsi, mc sekarang, mc avg entry, invested, hasil (LOLOS / TIDAK_LOLOS:... / DRY_RUN_STOP / BOUGHT / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / POPUP_MISMATCH)
- `fomo_trail.csv`: waktu, link coin, nama, puncak margin (`RESET` setelah SOLD atau AD BOUGHT). Dipakai trailing stop supaya puncak tetap tersimpan walau run/Chrome di-restart. Hapus file ini untuk reset semua puncak.
