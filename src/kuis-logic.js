// Logika evaluasi kuis paralel (Pre-test Set A & Post-test Set B), latihan sumber, kompatibilitas format lama,
// serta ekspor hasil berpasangan tanpa nama untuk pilot mahasiswa UNJ.
import { KOMPETENSI_LABEL, VERSI_SOAL, kuisSetA, kuisSetB } from '../data/kuis.js';

export function buatKodePeserta(randomFn = Math.random) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let kode = '';
  for (let i = 0; i < 4; i++) kode += chars[Math.floor(randomFn() * chars.length)];
  return `UNJ-${kode}`;
}

// Mempertahankan skor lama jika format penyimpanan berubah.
export function migrasiSkorKuis(raw) {
  if (!raw || typeof raw !== 'object') return { versi: VERSI_SOAL, pesertaKode: null, sebelum: null, sesudah: null };
  const normTahap = (item, soalList) => {
    if (!item || typeof item.skor !== 'number') return null;
    const total = item.total || soalList.length || 5;
    const persen = typeof item.persen === 'number' ? item.persen : Math.round((item.skor / total) * 100);
    return {
      skor: item.skor,
      total,
      persen,
      waktu: item.waktu ?? null,
      jawaban: Array.isArray(item.jawaban) ? item.jawaban : null,
      perKompetensi: item.perKompetensi ?? null,
      legacy: !item.perKompetensi,
    };
  };
  return {
    versi: raw.versi || 'legacy-v1',
    pesertaKode: raw.pesertaKode ?? null,
    sebelum: normTahap(raw.sebelum, kuisSetA),
    sesudah: normTahap(raw.sesudah, kuisSetB),
  };
}

export function nilaiSetKuis(soalList, pilihanIndices) {
  let skor = 0;
  const perKompetensi = {};
  const rincian = [];

  soalList.forEach((s, i) => {
    const dipilih = Number(pilihanIndices[i]);
    const benar = dipilih === s.benar;
    if (benar) skor += 1;
    const comp = perKompetensi[s.kompetensi] ?? { benar: 0, total: 0 };
    comp.total += 1;
    if (benar) comp.benar += 1;
    perKompetensi[s.kompetensi] = comp;
    rincian.push({ id: s.id ?? `s${i}`, kompetensi: s.kompetensi, dipilih, kunci: s.benar, benar });
  });

  const total = soalList.length || 1;
  const persen = Math.round((skor / total) * 100);
  const kompetensiLemah = Object.entries(perKompetensi)
    .filter(([, v]) => v.benar < v.total)
    .map(([k]) => ({ id: k, label: KOMPETENSI_LABEL[k] ?? k }));

  return {
    skor,
    total,
    persen,
    perKompetensi,
    kompetensiLemah,
    jawaban: rincian,
    waktu: new Date().toISOString(),
  };
}

export function ringkasPerubahanPilot(state) {
  const pre = state?.sebelum;
  const post = state?.sesudah;
  const deltaPoin = pre && post ? post.persen - pre.persen : null;
  const sumberDiagnosis = post?.kompetensiLemah ?? pre?.kompetensiLemah ?? [];

  return {
    sudahPre: Boolean(pre),
    sudahPost: Boolean(post),
    pembahasanPreTerbuka: Boolean(post),
    sebelumPersen: pre?.persen ?? null,
    sesudahPersen: post?.persen ?? null,
    perubahanPoinPersentase: deltaPoin,
    kompetensiPerluDilatih: sumberDiagnosis,
  };
}

export function eksporHasilPilot(rawState, latihanState = {}, kodePeserta) {
  const state = migrasiSkorKuis(rawState);
  const ringkas = ringkasPerubahanPilot(state);
  const kode = kodePeserta || state.pesertaKode || buatKodePeserta();
  return {
    versi_soal: VERSI_SOAL,
    versi_penyimpanan: state.versi,
    peserta_kode: kode,
    dibuat_pada: new Date().toISOString(),
    pre_test: state.sebelum,
    post_test: state.sesudah,
    perubahan_poin_persentase: ringkas.perubahanPoinPersentase,
    kompetensi_perlu_dilatih: ringkas.kompetensiPerluDilatih,
    latihan_sumber: latihanState,
    cakupan_pilot: 'Pilot UNJ (rencana evaluasi: minimal 30 mahasiswa UNJ; baseline pengguna aktif harian dari 30 hari pertama pilot, target lanjutan +30%).',
    catatan_keterbatasan: 'Skor dan riwayat hanya tersimpan lokal pada perangkat ini tanpa nama. Pengukuran pengguna aktif harian lintas perangkat dan dampak kepatuhan pajak memerlukan instrumen evaluasi terpisah.',
  };
}
