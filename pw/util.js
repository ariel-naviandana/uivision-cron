// pw/util.js — waktu WIB, log, parsing angka, tulis CSV
const fs = require('fs');
const path = require('path');

let TZ = 'Asia/Jakarta';
const setTimezone = (tz) => { if (tz) TZ = tz; };
const getTimezone = () => TZ;

function nowTs(d = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(d).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}:${p.second}`;
}

const COLORS = { info: '\x1b[36m', ok: '\x1b[32m', warn: '\x1b[33m', err: '\x1b[31m' };
function log(msg, level = 'info') {
    console.log(`${COLORS[level] || ''}[${nowTs()}] ${msg}\x1b[0m`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// angka acak di antara min dan max
const rand = (min, max) => min + Math.random() * (max - min);
// ms +- pct (default 30%), supaya jeda tidak selalu sama persis
const jitter = (ms, pct = 0.3) => Math.max(0, Math.round(ms * (1 + rand(-pct, pct))));

// "$1.2K" / "27.6K" / "$350" / 40700 -> angka. -1 kalau tidak terbaca (sama dengan macro)
function money(text) {
    const v = String(text ?? '').match(/\$?\s*([\d,.]+)\s*([KMBT]?)/i);
    if (!v) return -1;
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[v[2].toUpperCase()] || 1;
    const n = parseFloat(v[1].replace(/,/g, '')) * mult;
    return Number.isFinite(n) ? n : -1;
}

// Margin dari teks kolom kanan: ▲ positif, ▼ negatif
function margin(text) {
    const m = String(text ?? '').match(/([▲▼])\s*([\d,.]+)\s*%/);
    if (!m) return 0;
    const p = parseFloat(m[2].replace(/,/g, ''));
    return m[1] === '▼' ? -p : p;
}

// Umur "4d 3h" / "45min" -> jam. -1 kalau tidak terbaca
function ageHours(text) {
    const re = /(\d+(?:\.\d+)?)\s*(mo|min|[smhdwy])/gi;
    const mult = { s: 1 / 3600, m: 1 / 60, min: 1 / 60, h: 1, d: 24, w: 168, mo: 720, y: 8760 };
    let tot = 0;
    let found = false;
    let m;
    while ((m = re.exec(String(text ?? ''))) !== null) {
        const k = m[2].toLowerCase();
        if (mult[k] === undefined) continue;
        tot += parseFloat(m[1]) * mult[k];
        found = true;
    }
    return found ? tot : -1;
}

// Append satu baris CSV tanpa quoting (format sama dengan csvSave UI.Vision)
const cell = (v) => String(v ?? '').replace(/[,\r\n"]/g, ' ').trim();
function appendCsv(dir, file, values) {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, file), values.map(cell).join(',') + '\n', 'utf8');
}

module.exports = { nowTs, log, sleep, money, margin, ageHours, appendCsv, setTimezone, getTimezone, rand, jitter };
