// Mesin jawab berbasis aturan: memahami pertanyaan, memilih baris tabel fakta, menyusun kartu jawaban.
// Tidak ada angka yang dibuat di sini; semua angka berasal dari baris `fakta`.
// shortcut: pencocokan kata kunci, bukan model bahasa; ganti dengan LLM yang hanya memilih id baris bila pertanyaan makin beragam.
import { formatNilai, persenRealisasi } from './hitung.js';

export const PESAN_TIDAK_TERSEDIA = 'Data ini belum tersedia di dokumen yang dimuat Transkeu.ID.';
export const PORTAL_RESMI = { nama: 'Portal APBN Kementerian Keuangan', url: 'https://www.kemenkeu.go.id/' };

const URUTAN_JENIS = { Anggaran: 0, Outlook: 1, Realisasi: 2 };
const LUAR_CAKUPAN = /\b(apbd|pemda|pemprov|pemkab|pemkot|provinsi|kabupaten)\b/;
const TANYA_ISTILAH = /\b(apa itu|apa arti|arti(nya)?|maksud(nya)?|definisi|pengertian|apa beda|bedanya)\b/;

const normal = (teks) => teks.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu, ' ').replace(/\s+/g, ' ').trim();

function tidakTersedia(alasan) {
  return {
    status: 'tidak_tersedia',
    pesan: PESAN_TIDAK_TERSEDIA,
    alasan,
    portal: PORTAL_RESMI,
    lanjutan: [
      'Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?',
      'Berapa belanja negara 2026?',
      'Pajak yang kita bayar dipakai buat apa?',
    ],
  };
}

// Cocok per kata utuh, agar "tol" tidak cocok dengan "kontrol".
const ada = (t, kata) => ` ${t} `.includes(` ${kata.toLowerCase()} `);

export function cariTopik(teks, topik) {
  const t = normal(teks);
  return topik.find((tp) => tp.kata_kunci.some((k) => ada(t, k))) ?? null;
}

function cariIstilah(teks, istilah) {
  const t = normal(teks);
  if (!TANYA_ISTILAH.test(t)) return null;
  return istilah.find((i) => [i.istilah, ...(i.alias ?? [])].some((k) => ada(t, k))) ?? null;
}

// Satu baris per (jenis, cakupan): untuk realisasi ambil posisi data terbaru.
function pilihBaris(baris) {
  const terpilih = new Map();
  for (const b of baris) {
    const kunci = `${b.jenis_angka}|${b.cakupan}`;
    const lama = terpilih.get(kunci);
    if (!lama || (b.tanggal_posisi ?? '') > (lama.tanggal_posisi ?? '')) terpilih.set(kunci, b);
  }
  return [...terpilih.values()].sort((a, b) => URUTAN_JENIS[a.jenis_angka] - URUTAN_JENIS[b.jenis_angka]);
}

export function jawab(pertanyaan, { fakta, kegunaan = [], topik, istilah = [] }) {
  const t = normal(pertanyaan);
  if (!t) return tidakTersedia('Pertanyaan kosong.');

  const def = cariIstilah(t, istilah);
  if (def) {
    return {
      status: 'istilah',
      istilah: def,
      lanjutan: [
        'Apa beda anggaran dan realisasi?',
        'Berapa anggaran pendidikan 2026?',
        'Berapa belanja negara 2026?',
      ],
    };
  }

  if (LUAR_CAKUPAN.test(t)) return tidakTersedia('Versi awal hanya memuat APBN pemerintah pusat, belum APBD.');

  const tp = cariTopik(t, topik);
  if (!tp) return tidakTersedia('Pertanyaan ini di luar topik APBN yang dimuat Transkeu.ID.');

  const barisTopik = fakta.filter((f) => f.topik === tp.id);
  const tahunTersedia = [...new Set(barisTopik.map((f) => f.tahun_anggaran))].sort();
  const tahunDiminta = t.match(/\b(20\d\d)\b/)?.[1];
  const tahun = tahunDiminta ? Number(tahunDiminta) : tahunTersedia.at(-1);
  if (!tahunTersedia.includes(tahun)) {
    return tidakTersedia(`Data ${tp.nama} untuk TA ${tahunDiminta ?? '-'} tidak ada. Tahun yang dimuat: ${tahunTersedia.join(', ') || 'belum ada'}.`);
  }

  let angka = pilihBaris(barisTopik.filter((f) => f.tahun_anggaran === tahun));
  // Satu topik bisa punya beberapa pos (mis. pendapatan, belanja, defisit): jika pertanyaan menyebut satu pos, tampilkan pos itu saja.
  const fokus = angka.find((a) => ada(t, a.cakupan.replace(/_/g, ' ')))?.cakupan;
  // Cakupan turunan ikut (subsidi_energi → subsidi_energi_kompensasi), cakupan lain tidak (pajak ≠ perpajakan).
  if (fokus) angka = angka.filter((a) => a.cakupan === fokus || a.cakupan.startsWith(`${fokus}_`));
  const anggaran = angka.find((a) => a.jenis_angka === 'Anggaran');
  const realisasi = angka.filter((a) => a.jenis_angka === 'Realisasi');
  const realisasiSama = anggaran && realisasi.find((r) => r.cakupan === anggaran.cakupan);
  const hitung = realisasiSama ? persenRealisasi(realisasiSama, anggaran) : null;

  const kalimat = [];
  if (anggaran) kalimat.push(`${anggaran.pos} TA ${tahun} sebesar ${formatNilai(anggaran)}.`);
  if (realisasiSama) {
    kalimat.push(`Yang sudah terealisasi ${realisasiSama.posisi_data} sebesar ${formatNilai(realisasiSama)}${hitung ? `, atau ${hitung.teksHasil} dari anggaran` : ''}.`);
  } else if (realisasi[0] && anggaran) {
    kalimat.push(`Realisasi yang tersedia ${realisasi[0].posisi_data} adalah untuk ${realisasi[0].pos.toLowerCase()}, sebesar ${formatNilai(realisasi[0])}.`);
  } else if (realisasi[0]) {
    kalimat.push(`Angka yang tersedia untuk ${realisasi[0].pos.toLowerCase()} TA ${tahun} adalah realisasi ${realisasi[0].posisi_data}, sebesar ${formatNilai(realisasi[0])}.`);
  }
  if (!anggaran && !realisasi.length && angka[0]) kalimat.push(`${angka[0].pos} (${angka[0].jenis_angka}) TA ${tahun} sebesar ${formatNilai(angka[0])}.`);

  const batasan = [];
  if (!anggaran) batasan.push(`Anggaran ${(realisasi[0]?.pos ?? tp.nama).toLowerCase()} TA ${tahun}: ${PESAN_TIDAK_TERSEDIA}`);
  if (!realisasi.length) batasan.push(`Realisasi ${(anggaran?.pos ?? tp.nama).toLowerCase()} TA ${tahun}: ${PESAN_TIDAK_TERSEDIA}`);
  else if (anggaran && !realisasiSama) batasan.push('Cakupan realisasi berbeda dengan cakupan anggaran, jadi persentase penyerapan tidak dihitung.');
  if (tp.batasan) batasan.push(tp.batasan);

  return {
    status: 'ok',
    topik: tp,
    tahun,
    ringkas: kalimat.slice(0, 3).join(' '),
    angka,
    hitung,
    kegunaan: kegunaan.filter((k) => (k.topik === tp.id || (tp.id === 'pajak' && k.topik === 'umum')) && k.tahun_anggaran === tahun),
    batasan,
    lanjutan: (tp.contoh ?? []).filter((c) => normal(c) !== t),
  };
}
