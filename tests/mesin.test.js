import test from 'node:test';
import assert from 'node:assert/strict';
import { jawab, PESAN_TIDAK_TERSEDIA } from '../src/mesin.js';

const baris = (b) => ({ satuan: 'Rp triliun', posisi_data: null, tanggal_posisi: null, ...b });
const fakta = [
  baris({ id: 'a26', topik: 'pendidikan', pos: 'Anggaran pendidikan', cakupan: 'pend_total', jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 800 }),
  baris({ id: 'r26a', topik: 'pendidikan', pos: 'Realisasi anggaran pendidikan', cakupan: 'pend_total', jenis_angka: 'Realisasi', tahun_anggaran: 2026, nilai: 200, posisi_data: 's.d. 31 Maret 2026', tanggal_posisi: '2026-03-31' }),
  baris({ id: 'r26b', topik: 'pendidikan', pos: 'Realisasi anggaran pendidikan', cakupan: 'pend_total', jenis_angka: 'Realisasi', tahun_anggaran: 2026, nilai: 400, posisi_data: 's.d. 30 Juni 2026', tanggal_posisi: '2026-06-30' }),
  baris({ id: 'a25', topik: 'pendidikan', pos: 'Anggaran pendidikan', cakupan: 'pend_total', jenis_angka: 'Anggaran', tahun_anggaran: 2025, nilai: 700 }),
  baris({ id: 'ka26', topik: 'kesehatan', pos: 'Anggaran kesehatan', cakupan: 'kes_total', jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 250 }),
  baris({ id: 'kr26', topik: 'kesehatan', pos: 'Belanja Kemenkes', cakupan: 'kes_kemenkes', jenis_angka: 'Realisasi', tahun_anggaran: 2026, nilai: 40, posisi_data: 's.d. 30 Juni 2026', tanggal_posisi: '2026-06-30' }),
];
const topik = [
  { id: 'pendidikan', nama: 'Pendidikan', kata_kunci: ['pendidikan', 'sekolah'] },
  { id: 'kesehatan', nama: 'Kesehatan', kata_kunci: ['kesehatan'] },
  { id: 'pajak', nama: 'Penerimaan Pajak', kata_kunci: ['pajak'] },
];
const istilah = [{ istilah: 'Pagu', alias: ['pagu anggaran'], arti: 'Batas tertinggi anggaran.' }];
const data = { fakta, topik, istilah, kegunaan: [] };

const semuaAngkaDariFakta = (hasil) => {
  const nilaiSah = new Set(fakta.map((f) => f.nilai));
  for (const a of hasil.angka) assert.ok(nilaiSah.has(a.nilai));
};

test('memisah anggaran dan realisasi terbaru, lalu menghitung persen', () => {
  const h = jawab('Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?', data);
  assert.equal(h.status, 'ok');
  assert.deepEqual(h.angka.map((a) => a.id), ['a26', 'r26b']);
  assert.equal(h.hitung.teksHasil, '50 persen');
  assert.match(h.ringkas, /Rp800 triliun/);
  assert.match(h.ringkas, /s\.d\. 30 Juni 2026 sebesar Rp400 triliun, atau 50 persen/);
  semuaAngkaDariFakta(h);
});

test('tanpa tahun memakai tahun terbaru yang dimuat', () => {
  assert.equal(jawab('anggaran sekolah berapa', data).tahun, 2026);
});

test('tahun lain memakai baris tahun itu saja, tanpa realisasi mengarang', () => {
  const h = jawab('anggaran pendidikan 2025', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['a25']);
  assert.equal(h.hitung, null);
  assert.ok(h.batasan[0].includes(PESAN_TIDAK_TERSEDIA));
});

test('cakupan berbeda: tidak ada persentase', () => {
  const h = jawab('realisasi kesehatan 2026', data);
  assert.equal(h.hitung, null);
  assert.equal(h.angka.length, 2);
  assert.ok(h.batasan.some((b) => b.includes('Cakupan realisasi berbeda')));
  assert.doesNotMatch(h.ringkas, /persen/);
});

test('data tidak ada: pesan baku tanpa angka', () => {
  for (const q of ['anggaran pendidikan 2019', 'berapa anggaran pajak', 'harga cabai hari ini', 'APBD provinsi Jawa Barat pendidikan', '']) {
    const h = jawab(q, data);
    assert.equal(h.status, 'tidak_tersedia', q);
    assert.equal(h.pesan, PESAN_TIDAK_TERSEDIA);
    assert.ok(h.portal.url.startsWith('https://'));
    assert.equal(h.angka, undefined);
  }
});

test('pertanyaan istilah dijawab dari kamus', () => {
  const h = jawab('Apa itu pagu?', data);
  assert.equal(h.status, 'istilah');
  assert.equal(h.istilah.istilah, 'Pagu');
});
