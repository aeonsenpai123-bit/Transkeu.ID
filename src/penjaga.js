// Penjaga jawaban AI: model bahasa hanya boleh menyebut angka lewat placeholder {{id}} yang diisi kode dari tabel fakta.
// Teks yang memuat angka lain ditolak seluruhnya, lalu aplikasi memakai mesin aturan.
import { formatNilai, persenRealisasi } from './hitung.js';
import { PESAN_TIDAK_TERSEDIA, PORTAL_RESMI } from './mesin.js';
import { validasiVisual, visualOtomatis } from './visual.js';

const URUTAN_JENIS = { Anggaran: 0, Outlook: 1, Realisasi: 2 };
const PLACEHOLDER = /\{\{\s*([a-z0-9-]+)(?:\|(posisi))?\s*\}\}/g;
// Setelah placeholder dibuang, hanya tahun anggaran yang dimuat yang boleh tersisa sebagai angka.
const ANGKA_LIAR = /\d+(?:[.,]\d+)*/g;
const TAHUN_BOLEH = new Set(['2025', '2026']);

export class JawabanDitolak extends Error {}

function cekTanpaAngka(teks, bagian) {
  const sisa = teks.replace(PLACEHOLDER, '').match(ANGKA_LIAR) ?? [];
  const liar = sisa.filter((a) => !TAHUN_BOLEH.has(a));
  if (liar.length) throw new JawabanDitolak(`${bagian} memuat angka yang tidak berasal dari tabel fakta: ${liar.join(', ')}`);
}

// Semua pasangan Realisasi–Anggaran bercakupan sama di antara baris yang dipilih dihitung kode.
export function hitungPasangan(angka) {
  for (const r of angka.filter((a) => a.jenis_angka === 'Realisasi')) {
    const a = angka.find((x) => x.jenis_angka === 'Anggaran' && x.cakupan === r.cakupan && x.tahun_anggaran === r.tahun_anggaran);
    const h = a && persenRealisasi(r, a);
    if (h) return h;
  }
  return null;
}

export function isiJawaban(keluaran, { fakta, kegunaan = [], istilah = [] }) {
  if (keluaran.status === 'tidak_tersedia') {
    cekTanpaAngka(keluaran.jawaban ?? '', 'Alasan');
    return { status: 'tidak_tersedia', pesan: PESAN_TIDAK_TERSEDIA, alasan: keluaran.jawaban, portal: PORTAL_RESMI, lanjutan: keluaran.lanjutan ?? [], ai: true };
  }

  const byId = new Map(fakta.map((f) => [f.id, f]));
  const angka = [...new Set(keluaran.fakta_ids ?? [])].map((id) => {
    if (!byId.has(id)) throw new JawabanDitolak(`id fakta tidak dikenal: ${id}`);
    return byId.get(id);
  }).sort((a, b) => URUTAN_JENIS[a.jenis_angka] - URUTAN_JENIS[b.jenis_angka]);
  const hitung = hitungPasangan(angka);

  for (const [bagian, teks] of [['Jawaban', keluaran.jawaban], ['Batasan', keluaran.batasan ?? ''], ...(keluaran.lanjutan ?? []).map((t) => ['Saran pertanyaan', t])]) {
    cekTanpaAngka(teks, bagian);
  }

  const isi = (teks) => teks.replace(PLACEHOLDER, (_, id, bagian) => {
    if (id === 'persen') {
      if (!hitung) throw new JawabanDitolak('{{persen}} dipakai, padahal tidak ada pasangan anggaran dan realisasi bercakupan sama');
      return hitung.teksHasil;
    }
    const b = byId.get(id);
    if (!b) throw new JawabanDitolak(`placeholder tidak dikenal: ${id}`);
    // Angka yang disebut di teks wajib ikut tampil sebagai baris bersumber.
    if (!angka.includes(b)) angka.push(b);
    if (bagian === 'posisi') return b.posisi_data ?? `TA ${b.tahun_anggaran}`;
    return formatNilai(b);
  });

  const guna = new Map(kegunaan.map((k) => [k.id, k]));
  const visual = validasiVisual(keluaran.visual, { fakta }) ?? visualOtomatis(angka);

  return {
    status: 'ok',
    ringkas: isi(keluaran.jawaban),
    angka: angka.sort((a, b) => URUTAN_JENIS[a.jenis_angka] - URUTAN_JENIS[b.jenis_angka]),
    hitung,
    kegunaan: (keluaran.kegunaan_ids ?? []).map((id) => guna.get(id)).filter(Boolean),
    istilah: (keluaran.istilah ?? []).map((n) => istilah.find((i) => i.istilah === n)).filter(Boolean),
    visual,
    batasan: keluaran.batasan ? [isi(keluaran.batasan)] : [],
    lanjutan: keluaran.lanjutan ?? [],
    ai: true,
  };
}
