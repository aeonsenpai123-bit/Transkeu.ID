import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAngka, formatNilai, persenRealisasi } from '../src/hitung.js';

const anggaran = { jenis_angka: 'Anggaran', tahun_anggaran: 2026, cakupan: 'x_total', satuan: 'Rp triliun', nilai: 200, pos: 'Pos X' };
const realisasi = { jenis_angka: 'Realisasi', tahun_anggaran: 2026, cakupan: 'x_total', satuan: 'Rp triliun', nilai: 50, posisi_data: 's.d. 30 Juni 2026' };

test('format angka gaya Indonesia', () => {
  assert.equal(formatAngka(3842.7), '3.842,7');
  assert.equal(formatAngka(1234567.25, 2), '1.234.567,25');
  assert.equal(formatAngka(769.0), '769');
  assert.equal(formatAngka(-616.2), '-616,2');
  assert.equal(formatAngka(0.5), '0,5');
});

test('format nilai selalu menyebut satuan', () => {
  assert.equal(formatNilai({ nilai: 769.1, satuan: 'Rp triliun' }), 'Rp769,1 triliun');
  assert.equal(formatNilai({ nilai: 450, satuan: 'Rp miliar' }), 'Rp450 miliar');
  assert.equal(formatNilai({ nilai: 2.78, satuan: 'persen' }), '2,78 persen');
});

test('persen realisasi dihitung kode dan rumusnya ditampilkan', () => {
  const h = persenRealisasi(realisasi, anggaran);
  assert.equal(h.hasil, 25);
  assert.equal(h.teksHasil, '25 persen');
  assert.equal(h.rumus, 'Rp50 triliun ÷ Rp200 triliun × 100% = 25 persen');
});

test('tidak menghitung jika tahun, cakupan, atau satuan berbeda', () => {
  assert.equal(persenRealisasi({ ...realisasi, tahun_anggaran: 2025 }, anggaran), null);
  assert.equal(persenRealisasi({ ...realisasi, cakupan: 'x_kementerian' }, anggaran), null);
  assert.equal(persenRealisasi({ ...realisasi, satuan: 'Rp miliar' }, anggaran), null);
  assert.equal(persenRealisasi(realisasi, { ...anggaran, nilai: 0 }), null);
  assert.equal(persenRealisasi(anggaran, realisasi), null);
  assert.equal(persenRealisasi({ ...realisasi, jenis_angka: 'Outlook' }, anggaran), null);
  assert.equal(persenRealisasi(undefined, anggaran), null);
});
