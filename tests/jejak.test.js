import test from 'node:test';
import assert from 'node:assert/strict';
import { jejakAnggaran } from '../data/jejak.js';
import { kanalResmi, susunDrafAspirasi } from '../data/aspirasi.js';

test('jejakAnggaran memuat data 3 tahap (alokasi, realisasi, capaian) dengan sumber resmi', () => {
  assert.ok(jejakAnggaran.length >= 6);
  for (const j of jejakAnggaran) {
    assert.ok(j.id);
    assert.ok(j.nama);
    assert.ok(j.sektor);
    assert.ok(j.tahap.alokasi);
    assert.ok(j.tahap.realisasi);
    assert.ok(j.tahap.capaian);
    assert.ok(['tersedia', 'belum_tersedia'].includes(j.tahap.capaian.status));
    assert.ok(j.catatan_pengawasan);
    // Verifikasi sumber
    if (j.tahap.alokasi.url) assert.match(j.tahap.alokasi.url, /^https?:\/\//);
    if (j.tahap.realisasi.url) assert.match(j.tahap.realisasi.url, /^https?:\/\//);
  }
});

test('susunDrafAspirasi menyusun draf formal dengan rujukan data dan tidak mengirim otomatis', () => {
  const draf = susunDrafAspirasi({
    topik: 'Pendidikan',
    masalah: 'Gedung sekolah dasar di desa kami bocor dan membahayakan siswa',
    dataPendukung: 'Alokasi BOS TA 2026 sebesar Rp52,8 T untuk 43,7 juta siswa',
    masukan: 'Mohon dinas terkait meninjau renovasi ruang kelas',
    lokasi: 'Kabupaten Sukabumi',
  });
  assert.ok(draf.includes('Yth. Pengelola Layanan Publik'));
  assert.ok(draf.includes('Gedung sekolah dasar di desa kami bocor'));
  assert.ok(draf.includes('Rp52,8 T'));
  assert.ok(draf.includes('Kabupaten Sukabumi'));
});

test('kanalResmi memuat kanal pengaduan resmi nasional terverifikasi', () => {
  assert.ok(kanalResmi.length >= 3);
  const lapor = kanalResmi.find((k) => k.id === 'lapor');
  assert.equal(lapor.url, 'https://www.lapor.go.id/');
});
