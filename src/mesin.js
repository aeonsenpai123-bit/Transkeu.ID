// Mesin jawab berbasis aturan: memahami pertanyaan, memilih baris tabel fakta, menyusun kartu jawaban.
// Digunakan untuk Mode Dasar (ketika layanan AI online tidak aktif/gagal) dan Mode Offline (dari paket belajar lokal).
// Tidak ada angka yang dibuat di sini; semua angka berasal dari baris `fakta` atau `instansi`.
import { formatNilai, persenRealisasi } from './hitung.js';
import { visualOtomatis } from './visual.js';
import { cariKamus } from '../data/istilah.js';

export const PESAN_TIDAK_TERSEDIA = 'Data ini belum tersedia di dokumen yang dimuat Transkeu.ID.';
export const PORTAL_RESMI = { nama: 'Portal APBN Kementerian Keuangan', url: 'https://www.kemenkeu.go.id/' };

const URUTAN_JENIS = { Anggaran: 0, Outlook: 1, Realisasi: 2 };
const LUAR_CAKUPAN = /\b(apbd|pemda|pemprov|pemkab|pemkot|provinsi|kabupaten|jakarta timur|jaktim|dki|kecamatan|kelurahan)\b/;
const TANYA_ISTILAH = /\b(apa itu|apa arti|arti(nya)?|maksud(nya)?|definisi|pengertian|apa beda|bedanya)\b/;

const normal = (teks) => String(teks ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu, ' ').replace(/\s+/g, ' ').trim();

function perluasKueri(teks) {
  return normal(teks)
    .replace(/\b(duit|uangku|uangnya)\b/g, 'uang')
    .replace(/\b(dipake|dipakai|kepake|terpakai)\b/g, 'dipakai realisasi')
    .replace(/\b(sekolahan|kuliah)\b/g, 'pendidikan')
    .replace(/\b(program indonesia pintar)\b/g, 'pip')
    .replace(/\b(berobat|dokter|puskesmas)\b/g, 'kesehatan');
}

function tidakTersedia(alasan, extra = {}) {
  return {
    status: 'tidak_tersedia',
    pesan: PESAN_TIDAK_TERSEDIA,
    alasan,
    portal: PORTAL_RESMI,
    lanjutan: [
      'Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?',
      'Bagaimana anggaran dan penyaluran PIP 2026?',
      'Pajak yang kita bayar dipakai buat apa?',
    ],
    ...extra,
  };
}

// Cocok per kata utuh, agar "tol" tidak cocok dengan "kontrol".
const ada = (t, kata) => ` ${t} `.includes(` ${kata.toLowerCase()} `);

export function cariTopik(teks, topik) {
  const t = perluasKueri(teks);
  return topik.find((tp) => tp.kata_kunci.some((k) => ada(t, k))) ?? null;
}

function cariIstilah(teks, istilah) {
  const t = normal(teks);
  if (!TANYA_ISTILAH.test(t)) return null;
  const langsung = istilah.find((i) => [i.istilah, ...(i.alias ?? []), ...(i.sinonim ?? [])].some((k) => ada(t, k)));
  if (langsung) return langsung;
  const bersih = t.replace(TANYA_ISTILAH, '').trim();
  if (!bersih) return null;
  return cariKamus(istilah, bersih)[0] ?? null;
}

function istilahTerkait(teksKalimat, istilah, tambahan = []) {
  const t = normal(teksKalimat);
  const hasil = [];
  const sudah = new Set();
  for (const nama of tambahan) {
    const temu = istilah.find((i) => i.istilah.toLowerCase() === nama.toLowerCase());
    if (temu && !sudah.has(temu.istilah)) {
      sudah.add(temu.istilah);
      hasil.push(temu);
    }
  }
  for (const i of istilah) {
    if (sudah.has(i.istilah)) continue;
    if ([i.istilah, ...(i.alias ?? [])].some((k) => k.length > 2 && ada(t, k))) {
      sudah.add(i.istilah);
      hasil.push(i);
    }
  }
  return hasil.slice(0, 5);
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

export function jawab(pertanyaan, { fakta, kegunaan = [], topik, istilah = [], jejak = [] }, riwayat = []) {
  const t = perluasKueri(pertanyaan);
  if (!t) return tidakTersedia('Pertanyaan kosong.');

  const def = cariIstilah(pertanyaan, istilah);
  if (def) {
    return {
      status: 'istilah',
      istilah: def,
      lanjutan: [
        'Apa beda anggaran dan realisasi?',
        'Berapa anggaran pendidikan 2026?',
        'Bagaimana anggaran dan penyaluran PIP 2026?',
      ],
    };
  }

  if (LUAR_CAKUPAN.test(normal(pertanyaan))) {
    const lokal = /\b(jakarta timur|jaktim|dki|sekolah saya|unj|kecamatan|kelurahan)\b/.test(normal(pertanyaan));
    return tidakTersedia(
      lokal
        ? 'Transkeu.ID memuat APBN pemerintah pusat TA 2025–2026 sebagai konteks nasional. Rincian dana sekolah, peserta, atau APBD wilayah seperti Jakarta Timur belum dimuat dan memerlukan sumber data daerah setempat.'
        : 'Versi awal hanya memuat APBN pemerintah pusat (TA 2025–2026), belum APBD provinsi/kabupaten/kota.',
      { topikSaran: ['Pendidikan & PIP 2026', 'Belanja Negara 2026', 'Kamus Pagu & Realisasi'] }
    );
  }

  const tanyaTahunLalu = /\b(tahun sebelumnya|tahun lalu|ta sebelumnya|ta lalu)\b/.test(t);
  const tindakLanjut = tanyaTahunLalu || /^(terus|lalu|kalau|nah|yang|itu|bagaimana|gimana|sudah berapa|berapa persen)/.test(t);
  const sebelumnya = [...riwayat].reverse().find((h) => cariTopik(h.tanya ?? '', topik))?.tanya ?? riwayat.at(-1)?.tanya ?? '';
  const tahunDiPertanyaan = t.match(/\b(20\d\d)\b/)?.[1];
  const teksSebelumnya = (tanyaTahunLalu || tahunDiPertanyaan) ? perluasKueri(sebelumnya).replace(/\b20\d\d\b/g, '') : perluasKueri(sebelumnya);
  const kueri = (tindakLanjut && sebelumnya && !cariTopik(t, topik)) ? `${teksSebelumnya} ${t}` : t;

  const tp = cariTopik(kueri, topik);
  if (!tp) {
    return tidakTersedia(
      'Pertanyaan ini di luar topik APBN yang dimuat paket belajar Transkeu.ID (Pendidikan/PIP, Kesehatan, Perlinsos, Infrastruktur, Subsidi Energi, Pajak, dan Belanja Negara TA 2025–2026).',
      { topikSaran: ['Pendidikan & PIP 2026', 'Kesehatan 2026', 'Subsidi Energi 2025–2026', 'Penerimaan Pajak 2025–2026'] }
    );
  }

  const tanyaPIP = /\b(pip|beasiswa|kip)\b/.test(kueri);
  const barisTopik = fakta.filter((f) => f.topik === tp.id && (tanyaPIP || !f.subtopik));
  const tahunTersedia = [...new Set(barisTopik.map((f) => f.tahun_anggaran))].sort();

  let tahunDiminta = tahunDiPertanyaan ?? (!tanyaTahunLalu ? kueri.match(/\b(20\d\d)\b/)?.[1] : null);
  if (!tahunDiminta && tanyaTahunLalu) {
    const tahunSebelumnya = Number(normal(sebelumnya).match(/\b(20\d\d)\b/)?.[1] ?? tahunTersedia.at(-1) ?? 2026);
    tahunDiminta = String(tahunSebelumnya - 1);
  }
  const tahun = tahunDiminta ? Number(tahunDiminta) : tahunTersedia.at(-1);

  if (!tahunTersedia.includes(tahun)) {
    return tidakTersedia(
      `Data ${tp.nama} untuk TA ${tahunDiminta ?? '-'} belum tersedia di dokumen yang dimuat Transkeu.ID. Tahun yang tersedia untuk topik ini: ${tahunTersedia.join(', ') || 'belum ada'}.`,
      { topik: tp, tahun: tahunDiminta ? Number(tahunDiminta) : null }
    );
  }

  let angka = pilihBaris(barisTopik.filter((f) => f.tahun_anggaran === tahun));
  if (tanyaPIP) {
    const khususPip = angka.filter((a) => a.cakupan === 'pip' || a.cakupan === 'paket_beasiswa');
    if (khususPip.length) angka = khususPip;
  } else {
    // Satu topik bisa punya beberapa pos (mis. pendapatan, belanja, defisit): jika pertanyaan menyebut satu pos, tampilkan pos itu saja.
    const fokus = angka.find((a) => ada(kueri, a.cakupan.replace(/_/g, ' ')))?.cakupan;
    // Cakupan turunan ikut (subsidi_energi → subsidi_energi_kompensasi), cakupan lain tidak (pajak ≠ perpajakan).
    if (fokus) angka = angka.filter((a) => a.cakupan === fokus || a.cakupan.startsWith(`${fokus}_`));
  }

  const anggaran = angka.find((a) => a.jenis_angka === 'Anggaran');
  const realisasi = angka.filter((a) => a.jenis_angka === 'Realisasi');
  const realisasiSama = anggaran && realisasi.find((r) => r.cakupan === anggaran.cakupan);
  const hitung = realisasiSama ? persenRealisasi(realisasiSama, anggaran) : null;

  const kalimat = [];
  if (tanyaPIP && anggaran && realisasi[0]) {
    kalimat.push(`Penyaluran Program Indonesia Pintar (PIP) ${realisasi[0].posisi_data} sebesar ${formatNilai(realisasi[0])} untuk 16 juta siswa.`);
    kalimat.push(`Sementara itu, ${anggaran.pos.toLowerCase()} TA ${tahun} sebesar ${formatNilai(anggaran)} merupakan pagu gabungan (PIP, KIP Kuliah, dan beasiswa lainnya), sehingga persentase penyerapan PIP tidak dapat dihitung dari kedua angka ini.`);
  } else {
    if (anggaran) kalimat.push(`${anggaran.pos} TA ${tahun} sebesar ${formatNilai(anggaran)}.`);
    if (realisasiSama) {
      kalimat.push(`Yang sudah terealisasi ${realisasiSama.posisi_data} sebesar ${formatNilai(realisasiSama)}${hitung ? `, atau ${hitung.teksHasil} dari anggaran` : ''}.`);
    } else if (realisasi[0] && anggaran) {
      kalimat.push(`Realisasi yang tersedia ${realisasi[0].posisi_data} adalah untuk ${realisasi[0].pos.toLowerCase()}, sebesar ${formatNilai(realisasi[0])}.`);
    } else if (realisasi[0]) {
      kalimat.push(`Angka yang tersedia untuk ${realisasi[0].pos.toLowerCase()} TA ${tahun} adalah realisasi ${realisasi[0].posisi_data}, sebesar ${formatNilai(realisasi[0])}.`);
    }
    if (!anggaran && !realisasi.length && angka[0]) kalimat.push(`${angka[0].pos} (${angka[0].jenis_angka}) TA ${tahun} sebesar ${formatNilai(angka[0])}.`);
  }

  const tanyaAnggaranPendidikanAmbigu =
    tp.id === 'pendidikan' &&
    !tanyaPIP &&
    /\banggaran pendidikan\b/.test(t) &&
    !/\b(terpakai|realisasi|persen|fungsi|kemendikdasmen|kemdiktisaintek)\b/.test(t);

  const batasan = [];
  if (!anggaran) batasan.push(`Anggaran ${(realisasi[0]?.pos ?? tp.nama).toLowerCase()} TA ${tahun}: ${PESAN_TIDAK_TERSEDIA}`);
  if (!realisasi.length) batasan.push(`Realisasi ${(anggaran?.pos ?? tp.nama).toLowerCase()} TA ${tahun}: ${PESAN_TIDAK_TERSEDIA}`);
  else if (anggaran && !realisasiSama) batasan.push('Cakupan realisasi berbeda dengan cakupan anggaran, jadi persentase penyerapan tidak dihitung.');
  if (tp.batasan) batasan.push(tp.batasan);

  const kegunaanTopik = kegunaan.filter((k) => (k.topik === tp.id || (tp.id === 'pajak' && k.topik === 'umum')) && k.tahun_anggaran === tahun);
  const paragraf = [];
  if (kalimat.length > 0) {
    paragraf.push({
      teks: kalimat.join(' '),
      source_ids: angka.map((a) => a.id),
    });
  }
  if (tanyaAnggaranPendidikanAmbigu) {
    const fungsiPendidikan = fakta.find((f) => f.id === 'fungsi-pendidikan-2026-anggaran');
    const teksKlarifikasi = fungsiPendidikan
      ? `Catatan cakupan: "anggaran pendidikan" di APBN memiliki beberapa ukuran yang berbeda. Total 20% APBN mencakup pusat, transfer ke daerah, dan pembiayaan (${formatNilai(anggaran)}), sedangkan belanja pemerintah pusat fungsi pendidikan sebesar ${formatNilai(fungsiPendidikan)}, dan pagu awal Kemendikdasmen (BA 138) tercatat terpisah di tabel instansi. Mana yang ingin kamu periksa lebih detail?`
      : 'Catatan cakupan: total anggaran pendidikan berbeda dengan belanja pemerintah pusat fungsi pendidikan dan pagu masing-masing kementerian. Pilih tindak lanjut jika ingin memperjelas.';
    paragraf.push({
      teks: teksKlarifikasi,
      source_ids: fungsiPendidikan ? ['pendidikan-2026-anggaran', fungsiPendidikan.id] : angka.map((a) => a.id),
    });
    if (fungsiPendidikan && !angka.some((a) => a.id === fungsiPendidikan.id)) angka.push(fungsiPendidikan);
  }
  if (kegunaanTopik.length > 0) {
    const daftarGuna = tanyaPIP ? kegunaanTopik.filter((k) => /pip|kip|beasiswa/i.test(k.teks)) : kegunaanTopik;
    if (daftarGuna.length > 0) {
      paragraf.push({
        teks: `Alokasi dana ini antara lain disalurkan untuk program: ${daftarGuna.slice(0, 3).map((k) => k.teks).join('; ')}.`,
        source_ids: daftarGuna.slice(0, 3).map((k) => k.id),
      });
    }
  }

  const sumber = [
    ...angka.map((a) => ({ id: a.id, jenis: 'dokumen', judul: a.dokumen, fakta: a, url: a.url })),
    ...kegunaanTopik.map((k) => ({ id: k.id, jenis: 'dokumen', judul: k.dokumen, fakta: { ...k, pos: k.teks, nilai: null }, url: k.url })),
  ];

  const istilahDisarankan = istilahTerkait(
    `${kalimat.join(' ')} ${tp.nama}`,
    istilah,
    tanyaPIP ? ['PIP', 'Pagu', 'Realisasi', 'Tanggal Posisi'] : ['Anggaran', 'Realisasi', 'Tanggal Posisi']
  );

  const lanjutan = tanyaAnggaranPendidikanAmbigu
    ? ['Bagaimana anggaran dan penyaluran PIP 2026?', 'Pagu awal Kemendikdasmen 2026 berapa?', 'Kalau tahun sebelumnya bagaimana?']
    : tanyaPIP
    ? ['Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?', 'Kenapa rasio PIP tidak dihitung dari pagu beasiswa?', 'Kalau tahun sebelumnya?']
    : (tp.contoh ?? []).filter((c) => normal(c) !== t);

  const jejakTerkait = tanyaPIP ? 'jejak-pip' : (jejak.find((j) => j.topik === tp.id)?.id ?? null);

  return {
    status: 'ok',
    topik: tp,
    tahun,
    ringkas: kalimat.slice(0, 3).join(' '),
    paragraf,
    sumber,
    angka,
    hitung,
    kegunaan: kegunaanTopik,
    istilah: istilahDisarankan,
    visual: visualOtomatis(angka, tp.id),
    batasan,
    lanjutan,
    jejakTerkait,
    latihanTerkait: tanyaPIP || tp.id === 'pendidikan' ? 'pip-cakupan' : null,
  };
}
