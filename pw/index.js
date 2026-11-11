// pw/index.js — titik masuk versi Playwright (juga dipakai untuk build fomo-pw.exe)
//   node pw/index.js          / fomo-pw.exe          -> jalankan scanner sesuai jadwal
//   node pw/index.js login    / fomo-pw.exe login    -> login ke fomo.family (sekali saja)
if (process.argv.slice(2).includes('login')) {
    require('./login');
} else {
    require('./run');
}
