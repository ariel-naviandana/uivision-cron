BUILD EXE (Windows PowerShell, jalankan di ROOT folder project, bukan di build/)
==========================================================
Ada 2 exe:
  1. uivision-scheduler.exe  -> scheduler lama (UI.Vision + cron), dari scheduler/index.js, config: config.json
  2. fomo-pw.exe             -> versi Playwright, dari pw/index.js, config: pw.config.json

Exe dibuat dengan Node SEA: isinya node.exe + kode yang di-bundle esbuild.
File perantara (bundle .js, .blob, config SEA) ada di folder build/, exe hasilnya di root.
Node yang dipakai untuk build harus versi yang sama dengan yang ingin dipakai exe-nya.


PERSIAPAN (sekali saja)
-----------------------
node --version
npm install
npm install -g esbuild

Config SEA (build/sea-config.json & build/sea-pw.json) sudah ada di repo. Kalau hilang / clone baru
tanpa folder build/, buat dulu (sekali saja):
New-Item -ItemType Directory build -Force
Set-Content build/sea-config.json '{ "main": "build/bundle.js", "output": "build/sea-prep.blob" }'
Set-Content build/sea-pw.json '{ "main": "build/bundle-pw.js", "output": "build/sea-pw.blob", "disableExperimentalSEAWarning": true }'

Setelah itu, build pertama kali dan build ulang pakai perintah yang sama di bawah
(Remove-Item cuma menghapus hasil build lama; kalau belum ada, dilewati tanpa error).


1. uivision-scheduler.exe (UI.Vision)
-------------------------------------
Remove-Item uivision-scheduler.exe, build\bundle.js, build\sea-prep.blob -ErrorAction SilentlyContinue
esbuild scheduler/index.js --bundle --platform=node --outfile=build/bundle.js
node --experimental-sea-config build/sea-config.json
node -e "require('fs').copyFileSync(process.execPath, 'uivision-scheduler.exe')"
npx postject uivision-scheduler.exe NODE_SEA_BLOB build/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

Kebutuhan saat dijalankan (taruh di folder yang sama dengan exe):
  - config.json
  - uivision.html (sesuai path "uivisionHtml" di config.json)


2. fomo-pw.exe (Playwright)
---------------------------
Remove-Item fomo-pw.exe, build\bundle-pw.js, build\sea-pw.blob -ErrorAction SilentlyContinue
esbuild pw/index.js --bundle --platform=node --external:playwright-core --outfile=build/bundle-pw.js
node --experimental-sea-config build/sea-pw.json
node -e "require('fs').copyFileSync(process.execPath, 'fomo-pw.exe')"
npx postject fomo-pw.exe NODE_SEA_BLOB build/sea-pw.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

Kebutuhan saat dijalankan (taruh di folder yang sama dengan exe):
  - pw.config.json
  - node_modules\playwright-core   (tidak bisa dimasukkan ke exe, hasil "npm install")
  - Google Chrome terpasang (path di pw.config.json -> browser.chromePath)

Pemakaian:
  fomo-pw.exe          jalankan scanner sesuai jadwal di pw.config.json
  fomo-pw.exe login    login ke fomo.family (sekali saja), lalu tutup jendela Chrome
  fomo-pw-login.bat    sama dengan "fomo-pw.exe login", tinggal double-click


Catatan
-------
- Peringatan "The signature seems corrupted" dari postject normal, exe tetap bisa dipakai.
- Jangan jalankan uivision-scheduler.exe dan fomo-pw.exe bersamaan: dua-duanya bertransaksi
  di akun fomo yang sama.
