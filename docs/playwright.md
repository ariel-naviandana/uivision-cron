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
| Key | Arti | Contoh |
|---|---|---|
| `timezone` | Zona waktu jadwal & log | `"Asia/Jakarta"` |
| `schedule` | Cron untuk memulai ulang run. `""` = jalan terus tanpa jadwal | `"*/15 * * * *"` |
| `runOnStart` | Langsung jalan saat start, tidak menunggu jadwal pertama | `true` |
| `restartBrowser` | Tutup & buka ulang Chrome tiap jadwal | `true` |
| `restartWaitMs` | Jeda (ms) setelah Chrome ditutup | `3000` |
| `profileName` | Nama profil fomo, dipakai sebagai `?r=` di URL | `"VagueCoralJay"` |
| `startTokenUrl` | Halaman awal scan: detail coin apa saja (tanpa `?r=`). Posisi dibaca dari panel "Your positions" | `"https://fomo.family/tokens/base/0xcbada7..."` |
| `sellEnabled` | `false` = sell (TP / trailing) tidak dicek sama sekali. Beda dengan `dryRunSell` yang tetap mengecek dan membuka form Sell | `true` |
| `adEnabled` | `false` = AD tidak dicek sama sekali (halaman detail tidak dibuka). Beda dengan `dryRunAd` | `true` |
| `dryRunSell` | `true` = berhenti sebelum klik konfirmasi Sell | `true` |
| `dryRunAd` | `true` = isi nominal tapi tidak klik Buy | `true` |
| `minProfit` | Trailing aktif: sell hanya kalau margin saat itu >= nilai ini. Trailing mati: dipakai sebagai TP (%) | `20` |
| `tpCustom` | TP khusus per coin, menggantikan `minProfit` untuk coin itu (hanya saat trailing mati). Nama tidak peka huruf besar/kecil. Kosong = `{}` | `{ "E/ACC": 10, "COLLECTOOOR": 30 }` |
| `trail.enabled` | `true` = sell pakai trailing stop (`tpCustom` tidak dipakai). `false` = sell saat margin >= `minProfit` | `false` |
| `trail.start` | Trailing mulai dihitung saat margin >= nilai ini (%) | `30` |
| `trail.drop` | Sell kalau margin turun >= sekian POIN dari puncak (puncak 50, drop 10 -> sell di <= 40) | `10` |
| `showDust` | `true` = buka list dust supaya posisi kecil ikut di-scan, `false` = dust ditutup / tidak di-scan | `true` |
| `exclude` | Coin yang dilewati total (tidak di-sell/AD). Nama tidak peka huruf besar/kecil. Kosong = `[]` | `["E/ACC", "GATO"]` |
| `adTrigger` | Margin (%) yang memicu cek AD (margin <= nilai ini) | `-25` |
| `adMinAgeH` | Umur coin minimal (jam) untuk AD | `6` |
| `adUseRsi` | `true` = RSI jadi syarat AD | `true` |
| `adRsiMax` | RSI maksimal supaya AD lolos | `30` |
| `adMinOrderUsd` | Minimum order manual (USD). `0` = otomatis dibaca dari tombol "Minimum amount $X" | `0` |
| `adBelowMin` | Invested < minimum order: `"skip"` = AD dilewati (BUY_MIN_ORDER), `"min"` = beli sebesar minimum | `"skip"` |
| `maxLoop` | Batas jumlah siklus per run. `0` = terus | `0` |
| `scanIntervalMs` | Jeda (ms) antar scan kalau tidak ada aksi | `6000` |
| `reloadEvery` | Reload halaman awal paksa tiap N scan | `4` |
| `clickTries` | Percobaan klik icon coin | `3` |
| `clickFailMax` | Coin di-skip otomatis kalau gagal diklik sebanyak ini | `3` |
| `errPauseMs` | Jeda (ms) setelah halaman fomo bermasalah | `60000` |
| `output.dir` | Folder log CSV | `"C:\\uivision\\datasources"` |
| `output.positionsFile` / `adLogFile` / `sellLogFile` / `trailFile` | Nama file log posisi / AD / sell / puncak trailing | `"fomo_positions.csv"` |
| `browser.chromePath` | Lokasi chrome.exe | `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"` |
| `browser.userDataDir` | Folder profil Chrome khusus bot (sesi login fomo) | `"C:\\chrome-profiles\\fomo-playwright"` |
| `browser.headless` | `true` = Chrome tanpa jendela | `false` |
| `browser.viewport` | `null` = halaman ikut ukuran jendela (maximize). Isi ukuran untuk ukuran tetap | `null` atau `{ "width": 1600, "height": 1000 }` |
| `wait.*` | Waktu tunggu (ms) halaman awal, detail coin, klik, RSI, navigasi | `"detailMs": 5000` |
| `selectors.*` | XPath/CSS elemen fomo (ubah di sini kalau tampilan fomo berubah) | `"row": "(//a[...])"` |

Sebelum scan, tombol "Show dust (N)" diklik kalau list dust masih tertutup (`selectors.dustButton`).

Syarat AD sama dengan macro: umur >= `adMinAgeH`, RSI <= `adRsiMax` (kalau dipakai),
market cap sekarang < avg entry, invested > 0. Nominal buy = invested (1:1). Maks 1x AD per coin per run.
Kalau tombol Buy berubah jadi "Insufficient balance" (saldo tidak cukup), AD dibatalkan dan dicatat BUY_SALDO_KURANG.

## Log (format sama dengan macro)
- `fomo_positions.csv`: waktu, nama, nominal, margin
- `fomo_sell_log.csv`: waktu, nama, nominal, margin, hasil (DRY_RUN_STOP / SOLD / SELL_GAGAL / MISMATCH / CLICK_GAGAL / SELL_MIN_ORDER)
- `fomo_ad_log.csv`: waktu, nama, umur(jam), rsi, mc sekarang, mc avg entry, invested, hasil (LOLOS / TIDAK_LOLOS:... / DRY_RUN_STOP / BOUGHT / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / POPUP_MISMATCH)
- `fomo_trail.csv`: waktu, link coin, nama, puncak margin (`RESET` setelah SOLD atau AD BOUGHT). Dipakai trailing stop supaya puncak tetap tersimpan walau run/Chrome di-restart. Hapus file ini untuk reset semua puncak.
