# Fomo Scanner versi Playwright

Versi Playwright fomo scanner. Dua tab dalam satu Chrome:
- **Tab 1 - sell & AD**: scan panel "Your positions" (port dari macro UI.Vision `fomo_scanner_v4`).
- **Tab 2 - buy**: scan watchlist di sidebar, beli coin yang market cap-nya masuk range, lalu unstar.

Fitur yang dijalankan diatur di `config/general.json` -> `run`.
Kode lama tetap: `npm start` (`scheduler/index.js`) masih menjalankan scheduler UI.Vision seperti biasa.

## Menjalankan
```
npm install          sekali (memasang playwright-core, tanpa download browser)
npm run pw:login     sekali: login ke fomo.family di jendela yang terbuka, lalu tutup jendelanya
npm run pw           jalankan scanner sesuai jadwal (berhenti dengan Ctrl+C)
```
Atau pakai exe (cara build ada di `docs/build-exe.md`): `fomo-pw.exe` untuk jalan, `fomo-pw.exe login` untuk login.
Exe butuh folder `config\` dan `node_modules\playwright-core` di folder yang sama.

Jangan jalankan `npm start` (UI.Vision) dan `npm run pw` bersamaan: dua-duanya bertransaksi di akun yang sama.

## Jadwal
Sama seperti scheduler lama: tiap `schedule` (default tiap 15 menit) run dimulai ulang dengan state baru
(daftar coin yang sudah di-AD dan hitungan gagal-klik di-reset). Bedanya, run lama dihentikan dengan rapi:
transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong di tengah seperti kill Chrome.

## Pengaturan: folder `config/`
Dibaca dari folder project (atau folder exe). Kalau folder `config/` tidak ada, `pw.config.json` lama (satu file) masih dibaca.

### `config/general.json`: jadwal, fitur yang dijalankan, dry run, profil, browser, folder log
| Key | Arti | Contoh |
|---|---|---|
| `timezone` | Zona waktu jadwal & log | `"Asia/Jakarta"` |
| `schedule` | Cron untuk memulai ulang run. `""` = jalan terus tanpa jadwal | `"*/15 * * * *"` |
| `runOnStart` | Langsung jalan saat start, tidak menunggu jadwal pertama | `true` |
| `restartBrowser` | Tutup & buka ulang Chrome tiap jadwal | `true` |
| `restartWaitMs` | Jeda (ms) setelah Chrome ditutup | `3000` |
| `run.sell` | `false` = sell (TP / trailing) tidak dicek sama sekali. Beda dengan `dryRun.sell` | `true` |
| `run.ad` | `false` = AD tidak dicek sama sekali (halaman detail tidak dibuka). Beda dengan `dryRun.ad` | `true` |
| `run.buy` | `true` = tab kedua dibuka untuk scanner buy (watchlist) | `false` |
| `dryRun.sell` | `true` = sell berhenti sebelum klik konfirmasi Sell | `true` |
| `dryRun.ad` | `true` = AD isi nominal tapi tidak klik Buy | `true` |
| `dryRun.buy` | `true` = scanner buy isi nominal tapi tidak klik Buy | `true` |
| `profileName` | Nama profil fomo, dipakai sebagai `?r=` di URL | `"VagueCoralJay"` |
| `startTokenUrl` | Halaman awal: detail coin apa saja (tanpa `?r=`). Dipakai kedua tab | `"https://fomo.family/tokens/base/0xcbada7..."` |
| `browser.chromePath` | Lokasi chrome.exe | `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"` |
| `browser.userDataDir` | Folder profil Chrome khusus bot (sesi login fomo) | `"C:\\chrome-profiles\\fomo-playwright"` |
| `browser.headless` | `true` = Chrome tanpa jendela | `false` |
| `browser.viewport` | `null` = halaman ikut ukuran jendela (maximize). Isi ukuran untuk ukuran tetap | `null` atau `{ "width": 1600, "height": 1000 }` |
| `output.dir` | Folder log CSV | `"C:\\uivision\\datasources"` |
| `output.positionsFile` / `adLogFile` / `sellLogFile` / `trailFile` / `buyLogFile` | Nama file log posisi / AD / sell / puncak trailing / buy | `"fomo_buy_log.csv"` |

### `config/sell-ad.json`: sell dan AD (tab 1)
| Key | Arti | Contoh |
|---|---|---|
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

### `config/buy.json`: scanner buy (tab 2)
| Key | Arti | Contoh |
|---|---|---|
| `unstarAfterBuy` | `true` = coin di-unstar (hilang dari watchlist) setelah berhasil beli | `true` |
| `scanIntervalMs` | Jeda (ms) antar scan watchlist | `10000` |
| `coins` | Coin yang dipantau. `name` = nama di watchlist (tidak peka huruf besar/kecil), beli `amount` (USD) kalau market cap di antara `mcapMin` dan `mcapMax`. Coin di watchlist yang tidak ada di sini diabaikan | `[{ "name": "COINA", "mcapMin": 10000, "mcapMax": 50000, "amount": 5 }]` |

### `config/paths.json`: selector
| Key | Arti | Contoh |
|---|---|---|
| `selectors.*` | XPath elemen fomo untuk sell & AD (ubah di sini kalau tampilan fomo berubah) | `"row": "(//a[...])"` |
| `selectors.watchlistTab` | Buy: tombol/tab untuk membuka watchlist di sidebar. Kosong = tidak diklik | `"//button[...]"` |
| `selectors.watchScroll` | Buy: panel sidebar yang bisa di-scroll. Watchlist hanya merender coin yang terlihat, jadi panel di-scroll dari atas ke bawah. Kosong = tidak di-scroll | `"//*[@id='discovery-panels']//div[contains(@class,'overflow-y-auto')][...]"` |
| `selectors.watchRow` | Buy (wajib): semua baris coin di watchlist, dalam kurung supaya bisa diberi nomor `[k]` | `"(//div[...]//a[...])"` |
| `selectors.watchRowName` | Buy (wajib): nama coin, relatif ke baris | `".//div[...]"` |
| `selectors.watchRowMcap` | Buy (wajib): teks market cap, relatif ke baris | `".//div[contains(.,'MC')]"` |
| `selectors.watchRowClick` | Buy: yang diklik untuk membuka detail coin, relatif ke baris | `".//img"` |
| `selectors.unstarButton` | Buy: tombol bintang di halaman detail untuk unstar | `"//button[...]"` |
| `selectors.buyTab` | Tab Buy di form trade (supaya bukan tab Sell yang aktif) | `"(//div[...]/button[normalize-space(.)='Buy'])[1]"` |

### `config/timing.json`: wait, retry, interval
| Key | Arti | Contoh |
|---|---|---|
| `maxLoop` | Batas jumlah siklus per run. `0` = terus | `0` |
| `scanIntervalMs` | Jeda (ms) antar scan sell/AD kalau tidak ada aksi | `6000` |
| `reloadEvery` | Reload halaman paksa tiap N scan | `4` |
| `clickTries` | Percobaan klik icon coin | `3` |
| `clickFailMax` | Coin di-skip otomatis kalau gagal diklik sebanyak ini (selama satu run) | `3` |
| `errPauseMs` | Jeda (ms) setelah halaman fomo bermasalah | `60000` |
| `wait.*` | Waktu tunggu (ms) halaman awal, detail coin, klik, RSI, navigasi | `"detailMs": 5000` |

Sebelum scan, tombol "Show dust (N)" diklik kalau list dust masih tertutup (`selectors.dustButton`).

Syarat AD sama dengan macro: umur >= `adMinAgeH`, RSI <= `adRsiMax` (kalau dipakai),
market cap sekarang < avg entry, invested > 0. Nominal buy = invested (1:1). Maks 1x AD per coin per run.
Kalau tombol Buy berubah jadi "Insufficient balance" (saldo tidak cukup), AD dibatalkan dan dicatat BUY_SALDO_KURANG.

## Scanner buy (tab 2)
1. Buka halaman awal, klik tab watchlist (`selectors.watchlistTab`), baca semua baris watchlist.
2. Coin yang ada di `config/buy.json -> coins`: market cap dibaca dari sidebar. Kalau di antara `mcapMin` dan `mcapMax`, buka detail coin.
3. Pilih tab Buy, isi `amount`, cek tombol "Buy <nama>" (minimum order / saldo kurang dicatat dan dilewati).
4. `dryRun.buy: true` (di `general.json`) berhenti di sini. Kalau tidak, klik Buy lalu unstar coin supaya hilang dari watchlist.
5. Setiap coin diproses maksimal 1x per run (termasuk dry run), jadi tidak terbeli dua kali walau unstar gagal.

## Log (format sama dengan macro)
- `fomo_positions.csv`: waktu, nama, nominal, margin
- `fomo_sell_log.csv`: waktu, nama, nominal, margin, hasil (DRY_RUN_STOP / SOLD / SELL_GAGAL / MISMATCH / CLICK_GAGAL / SELL_MIN_ORDER)
- `fomo_ad_log.csv`: waktu, nama, umur(jam), rsi, mc sekarang, mc avg entry, invested, hasil (LOLOS / TIDAK_LOLOS:... / DRY_RUN_STOP / BOUGHT / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / POPUP_MISMATCH)
- `fomo_buy_log.csv`: waktu, nama, mcap, mcapMin, mcapMax, nominal, hasil (DRY_RUN_STOP / BOUGHT / BOUGHT_UNSTAR_GAGAL / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / DETAIL_MISMATCH)
- `fomo_trail.csv`: waktu, link coin, nama, puncak margin (`RESET` setelah SOLD atau AD BOUGHT). Dipakai trailing stop supaya puncak tetap tersimpan walau run/Chrome di-restart. Hapus file ini untuk reset semua puncak.
