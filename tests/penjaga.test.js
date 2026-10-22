import test from 'node:test';
import assert from 'node:assert/strict';
import { isiJawaban, JawabanDitolak } from '../src/penjaga.js';
import { PESAN_TIDAK_TERSEDIA } from '../src/mesin.js';

const fakta = [
  { id: 'a', jenis_angka: 'Anggaran', tahun_anggaran: 2026, cakupan: 'x', satuan: 'Rp triliun', nilai: 800, pos: 'Anggaran X', posisi_data: null },
  { id: 'r', jenis_angka: 'Realisasi', tahun_anggaran: 2026, cakupan: 'x', satuan: 'Rp triliun', nilai: 200, pos: 'Anggaran X', posisi_data: 's.d. 30 Juni 2026' },
  { id: 'k', jenis_angka: 'Realisasi', tahun_anggaran: 2026, cakupan: 'y', satuan: 'Rp triliun', nilai: 50, pos: 'Belanja Y', posisi_data: 's.d. 30 Juni 2026' },
];
const kegunaan = [{ id: 'guna-1', teks: 'Program Z' }];
const data = { fakta, kegunaan, istilah: [{ istilah: 'Pagu', arti: '...' }] };
const dasar = { status: 'jawab', fakta_ids: [], kegunaan_ids: [], istilah: [], batasan: '', lanjutan: [] };

test('placeholder diisi kode dari tabel fakta, persen dihitung kode', () => {
  const h = isiJawaban({ ...dasar, jawaban: 'Anggaran X TA 2026 sebesar {{a}}; terpakai {{r|posisi}} sebesar {{r}} ({{persen}}).', fakta_ids: ['a', 'r'], kegunaan_ids: ['guna-1'], istilah: ['Pagu'] }, data);
  assert.equal(h.ringkas, 'Anggaran X TA 2026 sebesar Rp800 triliun; terpakai s.d. 30 Juni 2026 sebesar Rp200 triliun (25 persen).');
  assert.deepEqual(h.angka.map((a) => a.id), ['a', 'r']);
  assert.equal(h.kegunaan[0].teks, 'Program Z');
  assert.equal(h.istilah[0].istilah, 'Pagu');
});

test('angka yang disebut lewat placeholder ikut tampil sebagai baris bersumber', () => {
  const h = isiJawaban({ ...dasar, jawaban: 'Totalnya {{a}}.' }, data);
  assert.deepEqual(h.angka.map((a) => a.id), ['a']);
});

test('angka karangan model ditolak di semua bagian teks', () => {
  for (const keluaran of [
    { ...dasar, jawaban: 'Anggarannya sekitar Rp800 triliun.' },
    { ...dasar, jawaban: 'Naik 20 persen dari tahun lalu.' },
    { ...dasar, jawaban: 'Oke {{a}}.', batasan: 'Data hanya 3 bulan.' },
    { ...dasar, jawaban: 'Oke.', lanjutan: ['Berapa 1,5 juta guru dapat tunjangan?'] },
    { status: 'tidak_tersedia', jawaban: 'APBD Jawa Barat sekitar 35 triliun belum dimuat.', lanjutan: [] },
  ]) assert.throws(() => isiJawaban(keluaran, data), JawabanDitolak, JSON.stringify(keluaran));
});

test('tahun anggaran yang dimuat boleh ditulis langsung', () => {
  assert.equal(isiJawaban({ ...dasar, jawaban: 'APBN 2026 berlaku Januari sampai Desember.' }, data).ringkas, 'APBN 2026 berlaku Januari sampai Desember.');
});

test('id atau persen yang tidak sah ditolak', () => {
  assert.throws(() => isiJawaban({ ...dasar, jawaban: 'x', fakta_ids: ['zzz'] }, data), JawabanDitolak);
  assert.throws(() => isiJawaban({ ...dasar, jawaban: '{{zzz}}' }, data), JawabanDitolak);
  // cakupan berbeda: tidak boleh ada persen
  assert.throws(() => isiJawaban({ ...dasar, jawaban: '{{persen}}', fakta_ids: ['a', 'k'] }, data), JawabanDitolak);
});

test('tidak tersedia memakai pesan baku', () => {
  const h = isiJawaban({ status: 'tidak_tersedia', jawaban: 'APBD belum dimuat.', lanjutan: [] }, data);
  assert.equal(h.pesan, PESAN_TIDAK_TERSEDIA);
  assert.ok(h.portal.url.startsWith('https://'));
});
