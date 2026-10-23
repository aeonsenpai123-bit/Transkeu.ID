import test from 'node:test';
import assert from 'node:assert/strict';
import { validasiVisual, visualOtomatis } from '../src/visual.js';
import { fakta } from '../data/fakta.js';

test('validasiVisual menerima permintaan yang sah dan mengisi data fakta', () => {
  const req = {
    tipe: 'batang',
    judul: 'Pendidikan 2026',
    fakta_ids: ['pendidikan-2026-anggaran', 'pendidikan-2026-realisasi-sep'],
    tujuan: 'Membandingkan pagu dan realisasi',
  };
  const res = validasiVisual(req, { fakta });
  assert.equal(res.tipe, 'batang');
  assert.equal(res.items.length, 2);
  assert.equal(res.items[0].id, 'pendidikan-2026-anggaran');
  assert.equal(res.cakupanBerbeda, false);
});

test('validasiVisual mendeteksi cakupan berbeda pada batang', () => {
  const req = {
    tipe: 'batang',
    judul: 'Kesehatan 2026',
    fakta_ids: ['kesehatan-2026-anggaran-fungsi', 'kesehatan-2026-realisasi-sep'],
    tujuan: 'Cakupan fungsi pusat vs realisasi total',
  };
  const res = validasiVisual(req, { fakta });
  assert.equal(res.cakupanBerbeda, true);
});

test('validasiVisual menolak tipe tidak dikenal atau fakta kosong', () => {
  assert.equal(validasiVisual({ tipe: 'pie', fakta_ids: ['pendidikan-2026-anggaran'] }, { fakta }), null);
  assert.equal(validasiVisual({ tipe: 'batang', fakta_ids: ['id-palsu'] }, { fakta }), null);
  assert.equal(validasiVisual(null, { fakta }), null);
});

test('visualOtomatis menghasilkan komposisi untuk BPP dan TKD', () => {
  const bpp = fakta.find((f) => f.id === 'umum-2026-bpp-anggaran');
  const tkd = fakta.find((f) => f.id === 'umum-2026-tkd-anggaran');
  const res = visualOtomatis([bpp, tkd]);
  assert.equal(res.tipe, 'komposisi');
  assert.equal(res.items.length, 2);
});

test('visualOtomatis menghasilkan kartu angka jika hanya 1 angka', () => {
  const item = fakta.find((f) => f.id === 'umum-2026-defisit-anggaran');
  const res = visualOtomatis([item]);
  assert.equal(res.tipe, 'kartu_angka');
  assert.equal(res.items[0].id, item.id);
});
