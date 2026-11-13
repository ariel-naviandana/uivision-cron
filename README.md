# fomo-scanner

Bot fomo.family: scan posisi di panel "Your positions" (halaman detail coin), sell saat TP / trailing stop dan average down (AD).
Versi Playwright juga punya scanner buy: beli coin di watchlist saat market cap masuk range (lihat `docs/playwright.md`).
Ada dua versi untuk sell/AD. Jangan jalankan keduanya bersamaan (akun fomo yang sama).

| Versi | Jalankan | Config | Exe |
|---|---|---|---|
| UI.Vision (scheduler + macro) | `npm start` | `uivision.config.json` | `uivision-scheduler.exe` |
| Playwright (sell/AD + buy) | `npm run pw` (login sekali: `npm run pw:login`) | folder `config/` | `fomo-pw.exe` |

## Struktur
```
fomo-scanner/
├─ macros/              salinan macro UI.Vision (yang dipakai ada di C:\uivision\macros)
│  ├─ fomo_scanner.json      v3: scan dari halaman profil
│  └─ fomo_scanner_v4.json   v4: scan dari panel "Your positions" di halaman detail coin
├─ scheduler/index.js   scheduler UI.Vision: jalankan macro lewat uivision.html sesuai jadwal
├─ pw/                  versi Playwright (index, run, scanner = sell/AD, buyer = buy, browser, config, login, util)
├─ config/              config Playwright: general, sell-ad, buy, paths, timing
├─ docs/
│  ├─ playwright.md     pengaturan config/ dan format log
│  └─ build-exe.md      cara build kedua exe
├─ build/               file perantara build exe (bundle .js, .blob, config SEA)
├─ uivision.config.json config scheduler UI.Vision (macroName, jadwal, kill Chrome)
├─ uivision.html        launcher macro UI.Vision
├─ uivision-scheduler.exe, fomo-pw.exe
└─ package.json
```

## Catatan
- `uivision.config.json` -> `macroName` menentukan macro yang dijalankan scheduler (`fomo_scanner` = v3, `fomo_scanner_v4` = v4).
- Kalau macro diubah, simpan di `C:\uivision\macros` dan salin juga ke `macros/` di sini.
- Exe membaca config dari folder exe, jadi `uivision.config.json`, folder `config/`, `uivision.html`,
  dan `node_modules` (untuk fomo-pw.exe) tetap di root bersama exe.
