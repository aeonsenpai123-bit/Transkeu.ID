// Alat kurasi: ubah PDF sumber jadi teks per halaman, lalu cari kata dengan nomor halamannya.
// Pakai: node scripts/cari-pdf.js ekstrak            (butuh pdftotext)
//        node scripts/cari-pdf.js cari "pendidikan" [berkas]
//        node scripts/cari-pdf.js halaman konpers-2026-10 12
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const folder = 'docs/sumber/apbn-kita';
const teks = join(folder, 'teks');
const [perintah, arg1, arg2] = process.argv.slice(2);

// pdftotext memisah halaman dengan \f, jadi indeks + 1 = nomor halaman PDF.
const halaman = (nama) => readFileSync(join(teks, `${nama}.txt`), 'utf8').split('\f');

if (perintah === 'ekstrak') {
  mkdirSync(teks, { recursive: true });
  for (const f of readdirSync(folder).filter((f) => f.endsWith('.pdf'))) {
    const keluar = join(teks, f.replace(/\.pdf$/, '.txt'));
    if (!existsSync(keluar)) execFileSync('pdftotext', ['-layout', join(folder, f), keluar]);
    console.log(f, halaman(f.replace(/\.pdf$/, '')).length - 1, 'halaman');
  }
} else if (perintah === 'cari') {
  const pola = new RegExp(arg1, 'i');
  for (const f of readdirSync(teks).filter((f) => f.endsWith('.txt') && (!arg2 || f.startsWith(arg2)))) {
    halaman(f.replace(/\.txt$/, '')).forEach((h, i) => {
      for (const baris of h.split('\n')) if (pola.test(baris)) console.log(`${f.replace(/\.txt$/, '')} hlm.${i + 1}: ${baris.trim().replace(/\s{2,}/g, '  ')}`);
    });
  }
} else if (perintah === 'halaman') {
  console.log(halaman(arg1)[Number(arg2) - 1]);
} else {
  console.log('Perintah: ekstrak | cari <regex> [awalan-berkas] | halaman <berkas> <nomor>');
}
