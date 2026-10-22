// Penjaga tabel fakta: baris yang tidak lengkap atau angkanya tidak cocok dengan kutipan tidak boleh masuk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fakta, kegunaan } from '../data/fakta.js';
import { topik } from '../data/topik.js';
import { formatAngka } from '../src/hitung.js';
import { jawab } from '../src/mesin.js';

const topikSah = new Set(topik.map((t) => t.id));
const tanpaTitik = (s) => s.replace(/\./g, '');

test('setiap baris fakta lengkap dan bisa diperiksa', () => {
  const id = new Set();
  for (const f of fakta) {
    const nama = f.id;
    assert.ok(!id.has(nama), `id ganda: ${nama}`);
    id.add(nama);
    assert.ok(topikSah.has(f.topik), `${nama}: topik`);
    assert.ok(['Anggaran', 'Outlook', 'Realisasi'].includes(f.jenis_angka), `${nama}: jenis_angka`);
    assert.ok([2025, 2026].includes(f.tahun_anggaran), `${nama}: tahun`);
    assert.ok(['Rp triliun', 'Rp miliar', 'persen'].includes(f.satuan), `${nama}: satuan`);
    assert.equal(typeof f.nilai, 'number', `${nama}: nilai`);
    for (const k of ['pos', 'cakupan', 'dokumen', 'penerbit', 'kutipan']) assert.ok(f[k]?.trim(), `${nama}: ${k} kosong`);
    assert.match(f.url, /^https:\/\//, `${nama}: url`);
    if (f.jenis_angka === 'Realisasi') {
      assert.ok(f.posisi_data, `${nama}: realisasi wajib punya posisi_data`);
      assert.match(f.tanggal_posisi ?? '', /^\d{4}-\d{2}-\d{2}$/, `${nama}: tanggal_posisi`);
    }
  }
});

test('angka di baris fakta muncul di kutipan dokumennya', () => {
  for (const f of fakta) {
    const angka = tanpaTitik(formatAngka(f.nilai, 2));
    // UU menulis rupiah penuh (Rp2.693.714.250.000.000,00), bukan triliun.
    const rupiahPenuh = f.satuan === 'Rp triliun' ? String(Math.round(f.nilai * 1e12)) : null;
    const kutipan = tanpaTitik(f.kutipan);
    assert.ok(kutipan.includes(angka) || (rupiahPenuh && kutipan.includes(rupiahPenuh)), `${f.id}: ${angka} tidak ada di kutipan "${f.kutipan}"`);
  }
});

test('setiap keterangan kegunaan punya sumber', () => {
  for (const k of kegunaan) {
    assert.ok(topikSah.has(k.topik));
    for (const kol of ['teks', 'dokumen', 'penerbit', 'kutipan']) assert.ok(k[kol]?.trim(), `${k.teks}: ${kol}`);
    assert.match(k.url, /^https:\/\//);
    for (const angka of k.teks.match(/\d[\d.,]*\d|\d/g) ?? []) assert.ok(k.kutipan.includes(angka), `${k.teks}: ${angka} tidak ada di kutipan`);
  }
});

const data = { fakta, kegunaan, topik };
const nilai = (id) => fakta.find((f) => f.id === id).nilai;

test('pembagian belanja konsisten antar dokumen', () => {
  // UU: belanja negara = belanja pemerintah pusat + TKD
  assert.ok(Math.abs(nilai('umum-2026-bpp-anggaran') + nilai('umum-2026-tkd-anggaran') - nilai('umum-2026-belanja-anggaran')) < 0.05);
  // DJA: 11 fungsi menjumlah ke belanja pemerintah pusat (selisih pembulatan)
  const fungsi = fakta.filter((f) => f.kelompok === 'belanja_fungsi');
  assert.equal(fungsi.length, 11);
  assert.ok(Math.abs(fungsi.reduce((s, f) => s + f.nilai, 0) - nilai('umum-2026-bpp-anggaran')) < 0.5);
});

test('persentase hitungan kode sama dengan persentase yang dicetak dokumen', () => {
  // Dokumen: "BELANJA NEGARA Rp2.660,5 T (69,2% dari pagu)", "PENDAPATAN NEGARA Rp2.341,5 T (74,2% dari target)"
  assert.equal(jawab('berapa belanja negara 2026', data).hitung.teksHasil, '69,2 persen');
  assert.equal(jawab('berapa pendapatan negara 2026', data).hitung.teksHasil, '74,2 persen');
});

test('pertanyaan contoh di PRD: anggaran pendidikan dan yang sudah dipakai', () => {
  const h = jawab('Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['pendidikan-2026-anggaran', 'pendidikan-2026-realisasi-sep']);
  assert.equal(h.hitung.teksHasil, '74,7 persen');
  assert.match(h.ringkas, /Rp769,1 triliun.*s\.d\. 30 September 2026 sebesar Rp574,2 triliun/);
});

test('pertanyaan yang menyebut satu pos hanya menampilkan pos itu', () => {
  const h = jawab('Berapa defisit APBN 2026?', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['umum-2026-defisit-anggaran', 'umum-2026-defisit-realisasi']);
  assert.deepEqual(jawab('penerimaan pajak 2025', data).angka.map((a) => a.id), ['pajak-2025-realisasi']);
});

test('anggaran fungsi (pusat saja) tidak dibagi dengan realisasi anggaran kesehatan total', () => {
  const h = jawab('anggaran kesehatan 2026', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['kesehatan-2026-anggaran-fungsi', 'kesehatan-2026-realisasi-sep']);
  assert.equal(h.hitung, null);
  assert.ok(h.batasan.some((b) => b.includes('Cakupan realisasi berbeda')));
});

test('target pajak dan realisasi pajak bercakupan sama, jadi persen dihitung', () => {
  const h = jawab('Berapa target penerimaan pajak 2026?', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['pajak-2026-anggaran', 'pajak-2026-realisasi-sep']);
  assert.equal(h.hitung.teksHasil, '68,2 persen');
});

test('topik tanpa realisasi tidak mengarang realisasi', () => {
  const h = jawab('anggaran perlindungan sosial 2026', data);
  assert.equal(h.hitung, null);
  assert.ok(h.batasan.some((b) => b.startsWith('Realisasi belanja fungsi perlindungan sosial (pemerintah pusat) TA 2026: Data ini belum tersedia')));
});

test('subsidi energi: anggaran (dengan kompensasi) tampil, tetapi tidak dibagi dengan realisasi subsidi energi saja', () => {
  const h = jawab('Subsidi energi 2026', data);
  assert.deepEqual(h.angka.map((a) => a.id), ['subsidi-energi-kompensasi-2026-anggaran', 'subsidi-energi-2026-realisasi-jun']);
  assert.equal(h.hitung, null);
});

test('jawaban dari data nyata hanya memakai angka tabel fakta', () => {
  const sah = new Set(fakta.map((f) => f.id));
  for (const t of topik) for (const q of t.contoh) {
    const h = jawab(q, { fakta, kegunaan, topik });
    if (h.status !== 'ok') continue;
    for (const a of h.angka) assert.ok(sah.has(a.id), q);
  }
});
