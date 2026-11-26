import { rankingInstansi, renderInstansi, hasilInstansi, CATATAN_INSTANSI } from './instansi.js';
import { renderClaimCheck } from './claim-check-ui.js';
import { documentUrl, traceEvidence, evidenceText } from './evidence.js';
import { renderImpacts } from './impacts-ui.js';
import { renderArticles } from './articles-ui.js';
import { fakta, kegunaan } from '../data/fakta.js';
import { topik, contohAwal } from '../data/topik.js';
import { istilah, cariKamus } from '../data/istilah.js';
import { kuisSetA, kuisSetB, latihanBertingkat, KOMPETENSI_LABEL, VERSI_SOAL } from '../data/kuis.js';
import { jejakAnggaran } from '../data/jejak.js';
import { kanalResmi, susunDrafAspirasi, PERINGATAN_PRIVASI_ASPIRASI } from '../data/aspirasi.js';
import { jawab, PESAN_TIDAK_TERSEDIA } from './mesin.js';
import { formatNilai, persenRealisasi } from './hitung.js';
import { ikon } from './ikon.js';
import { renderVisual } from './visual.js';
import {
  PAKET_META,
  bacaStatusPaket,
  verifikasiCacheUtuh,
  unduhPaketOffline,
  hapusPaketOffline,
  hapusSemuaDataLokal,
  formatUkuranByte,
} from './offline.js';
import {
  buatKodePeserta,
  migrasiSkorKuis,
  nilaiSetKuis,
  ringkasPerubahanPilot,
  eksporHasilPilot,
} from './kuis-logic.js';

const data = { fakta, kegunaan, topik, istilah, jejak: jejakAnggaran };
const $ = (id) => document.getElementById(id);
const baris = (id) => fakta.find((f) => f.id === id);
const IKON_TOPIK = { pendidikan: 'sekolah', kesehatan: 'hati', perlinsos: 'tangan', infrastruktur: 'jalan', subsidi_energi: 'api', pajak: 'koin' };
for (const e of document.querySelectorAll('[data-ikon]')) e.prepend(ikon(e.dataset.ikon));

// Daftarkan Service Worker PWA bila didukung (dilewati di lingkungan test Node/linkedom).
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined' && !location.protocol.startsWith('file')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

let promptInstallPWA = null;
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptInstallPWA = e;
    perbaruiBannerOffline?.();
  });
  window.addEventListener('appinstalled', () => {
    promptInstallPWA = null;
    toast('Transkeu.ID berhasil dipasang ke perangkat.');
    perbaruiBannerOffline?.();
  });
}

// Pembuat elemen kecil. Teks selalu lewat textContent, tidak pernah innerHTML, karena pertanyaan pengguna ikut ditampilkan.
function el(tag, attrs = {}, ...anak) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const a of anak.flat()) if (a != null && a !== false) e.append(a);
  return e;
}

// Penyimpanan hanya di perangkat (PRD: tanpa login). Bisa gagal di mode privat, jadi dibungkus.
const simpan = {
  baca(k, awal) { try { return JSON.parse(localStorage.getItem(k)) ?? awal; } catch { return awal; } },
  tulis(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* tetap jalan tanpa penyimpanan */ } },
};

function toast(pesan) {
  const t = $('toast');
  if (!t) return;
  t.textContent = pesan;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 3500);
}

const sedangOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

function perbaruiIndikatorJaringan() {
  const lencana = $('status-jaringan');
  if (!lencana) return;
  const statusPaket = bacaStatusPaket();
  if (sedangOffline()) {
    lencana.textContent = statusPaket ? 'Mode Offline · Siap' : 'Offline';
    lencana.className = 'status-jaringan offline';
  } else if (statusPaket) {
    lencana.textContent = 'Siap offline';
    lencana.className = 'status-jaringan siap';
  } else {
    lencana.textContent = '';
    lencana.className = 'status-jaringan';
  }
}

/* ---------- Bottom sheet (kartu sumber dan istilah) ---------- */
function bukaSheet(judul, namaIkon, ...isi) {
  $('sheet-judul').replaceChildren(ikon(namaIkon), judul);
  $('sheet-badan').replaceChildren(...isi);
  $('sheet').showModal();
}
$('sheet-tutup').addEventListener('click', () => $('sheet').close());
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').close(); });

const labelJenis = (b) => (b.jenis_angka === 'Realisasi' ? `Realisasi ${b.posisi_data}` : `${b.jenis_angka} TA ${b.tahun_anggaran}`);
const judulSumber = (b) => `${b.dokumen}${b.halaman_atau_tabel ? `, ${b.halaman_atau_tabel}` : ''}`;

function bukaSumber(b) {
  const diperiksa = b.diperiksa_oleh?.length >= 2;
  const tautan = documentUrl(b);
  const perluInternet = Boolean(tautan);
  const tombolLink = tautan
    ? el('a', {
        class: 'tombol tombol-utama',
        href: tautan,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: 'width:100%',
        onclick: (e) => {
          if (sedangOffline()) {
            e.preventDefault();
            toast('PDF dokumen asli memerlukan internet. Kutipan dan nomor halaman sudah tersedia offline di kartu ini.');
          }
        },
      }, ikon('keluar'), 'Buka dokumen asli ', el('span', { class: 'badge-internet' }, 'Perlu internet'))
    : el('p', { class: 'catatan-kecil' }, 'Tautan dokumen belum tersedia pada entri ini.');

  bukaSheet('Kartu sumber', 'dokumen',
    b.nilai == null
      ? el('p', { class: 'ringkas', style: 'margin-top:14px' }, b.pos)
      : el('div', { class: `jenis-${b.jenis_angka}`, style: 'margin-top:14px;display:grid;gap:4px;border:0' },
        el('span', { class: 'label-jenis' }, labelJenis(b)),
        el('p', { class: 'sheet-nilai' }, formatNilai(b)),
        el('span', { class: 'pos' }, `${b.pos}, TA ${b.tahun_anggaran}`)),
    el('dl', { class: 'rincian' },
      el('dt', {}, 'Dokumen'), el('dd', {}, b.dokumen),
      el('dt', {}, 'Instansi'), el('dd', {}, b.penerbit),
      el('dt', {}, 'Tahun'), el('dd', {}, String(b.tahun_dokumen ?? b.tahun_anggaran)),
      el('dt', {}, 'Jenis & Satuan'), el('dd', {}, `${b.jenis_angka ?? 'Informasi'} (${b.satuan ?? 'sesuai dokumen'})`),
      el('dt', {}, 'Cakupan'), el('dd', {}, b.cakupan ?? 'Mengikuti dokumen resmi'),
      b.posisi_data ? el('dt', {}, 'Tanggal posisi') : null,
      b.posisi_data ? el('dd', {}, b.posisi_data) : null,
      el('dt', {}, 'Halaman / Tabel'), el('dd', {}, b.halaman_atau_tabel ?? 'Halaman web (tanpa nomor halaman)'),
      el('dt', {}, 'Pemeriksaan'), el('dd', {}, diperiksa ? `Dicek ${b.diperiksa_oleh.join(' dan ')}, ${b.tanggal_periksa}` : 'Belum dicek dua orang tim'),
    ),
    el('div', { class: 'judul-kecil' }, 'Kutipan pendukung'),
    el('blockquote', { class: 'kutipan' }, b.kutipan),
    b.catatan ? el('p', { class: 'catatan-kecil', style: 'margin-bottom:12px' }, `Catatan: ${b.catatan}`) : null,
    tombolLink,
    perluInternet ? el('p', { class: 'catatan-kecil', style: 'margin-top:8px' }, 'Catatan akses: paket offline menyimpan angka, halaman, dan kutipan. Membuka file PDF penuh di portal resmi memerlukan koneksi internet.') : null,
  );
}

function bukaIstilah(i) {
  const terkaitItems = (i.terkait ?? []).map((n) => istilah.find((x) => x.istilah.toLowerCase() === n.toLowerCase())).filter(Boolean);
  bukaSheet(
    i.istilah,
    'kamus',
    i.alias?.length || i.sinonim?.length
      ? el('p', { class: 'catatan-kecil', style: 'margin-top:10px' }, `Istilah lain / sinonim: ${[...(i.alias ?? []), ...(i.sinonim ?? [])].join(', ')}`)
      : null,
    el('p', { class: 'ringkas', style: 'margin-top:12px' }, i.arti),
    i.contoh ? el('p', { class: 'batasan', style: 'margin-top:12px' }, i.contoh) : null,
    terkaitItems.length
      ? el('div', { style: 'margin-top:14px' },
          el('div', { class: 'judul-kecil' }, 'Istilah terkait'),
          el('div', { class: 'chips' }, terkaitItems.map((t) => el('button', { type: 'button', class: 'chip', onclick: () => bukaIstilah(t) }, t.istilah))))
      : null,
    el('p', { class: 'catatan-kecil', style: 'margin-top:12px' }, 'Penjelasan sederhana dari Kamus Transkeu.ID (tersedia offline).')
  );
}

/* ---------- Penanda istilah ---------- */
const semuaIstilah = istilah
  .flatMap((i) => [i.istilah, ...(i.alias ?? [])].map((kata) => ({ kata, i })))
  .filter(({ kata }) => kata.length > 2)
  .sort((a, b) => b.kata.length - a.kata.length);
const polaIstilah = new RegExp(`(?<![\\p{L}\\p{N}])(${semuaIstilah.map(({ kata }) => kata.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

// Tiap istilah hanya ditandai sekali per kartu agar teks tidak penuh garis bawah.
function teksBeristilah(teks, sudah) {
  const hasil = [];
  let akhir = 0;
  for (const m of teks.matchAll(polaIstilah)) {
    const cocok = semuaIstilah.find(({ kata }) => kata.toLowerCase() === m[0].toLowerCase());
    if (!cocok || sudah.has(cocok.i.istilah)) continue;
    sudah.add(cocok.i.istilah);
    hasil.push(teks.slice(akhir, m.index));
    hasil.push(el('button', { type: 'button', class: 'istilah-tag', title: 'Lihat arti istilah', onclick: () => bukaIstilah(cocok.i) }, m[0]));
    akhir = m.index + m[0].length;
  }
  hasil.push(teks.slice(akhir));
  return hasil;
}

function tombolNilai(b) {
  return el('button', { type: 'button', class: 'nilai', onclick: () => bukaSumber(b), 'aria-label': `${formatNilai(b)}. Lihat sumber` },
    el('span', { class: 'v' }, formatNilai(b)), el('span', { class: 'ikon-sumber', 'aria-hidden': 'true' }, ikon('dokumen'), 'Cek sumber'));
}

function barisAngka(b, sudah) {
  return el('li', { class: `jenis-${b.jenis_angka}` },
    el('span', { class: 'label-jenis' }, labelJenis(b)),
    el('span', { class: 'pos' }, teksBeristilah(b.pos, sudah)),
    el('span', { class: 'catatan-kecil' }, `TA ${b.tahun_anggaran} · ${b.jenis_angka} · Satuan: ${b.satuan} · Cakupan: ${b.cakupan}${b.posisi_data ? ` · ${b.posisi_data}` : ''}`),
    tombolNilai(b),
    b.diperiksa_oleh?.length >= 2 ? null : el('span', { class: 'belum-diperiksa' }, 'Belum dicek dua orang tim'),
  );
}

/* ---------- Umpan balik ---------- */
function umpanBalik(pertanyaan, hasil) {
  const wadah = el('div', {});
  const catat = (jenis, extra = {}) => {
    const daftar = simpan.baca('transkeu.umpan', []);
    daftar.push({ jenis, pertanyaan, mode: hasil.ai ? 'ai' : (hasil.mode ?? 'dasar'), waktu: new Date().toISOString(), ...extra });
    simpan.tulis('transkeu.umpan', daftar);
  };
  const tombol = (label, jenis, ik) => el('button', { type: 'button', class: 'tombol', 'aria-pressed': 'false', onclick: (e) => {
    if (jenis === 'angka_salah') return laporAngka();
    catat(jenis);
    for (const b of wadah.querySelectorAll('.umpan button')) b.setAttribute('aria-pressed', String(b === e.currentTarget));
    toast('Terima kasih atas umpan baliknya.');
  } }, ik, label);

  function laporAngka() {
    if (wadah.querySelector('form')) return;
    const pilihan = el('select', { class: 'cari', style: 'margin:0;border-radius:14px' },
      ...(hasil.angka ?? []).map((b) => el('option', { value: b.id }, `${labelJenis(b)}: ${formatNilai(b)}`)),
      el('option', { value: '' }, 'Lainnya / tidak ada di daftar'));
    const catatan = el('textarea', { class: 'cari', rows: '3', maxlength: '500', style: 'margin:0;border-radius:14px', placeholder: 'Apa yang salah? (opsional)' });
    const form = el('form', { class: 'form-lapor', onsubmit: (e) => {
      e.preventDefault();
      catat('angka_salah', { fakta_id: pilihan.value || null, catatan: catatan.value.trim() });
      form.replaceWith(el('p', { class: 'catatan-kecil', style: 'margin-top:12px' }, 'Laporan tersimpan di perangkat ini dan akan diperiksa tim saat data umpan balik dikumpulkan.'));
    } },
      el('label', {}, 'Angka mana yang salah?', pilihan),
      el('label', {}, 'Keterangan', catatan),
      el('button', { class: 'tombol tombol-utama', type: 'submit' }, 'Kirim laporan'));
    wadah.append(form);
    pilihan.focus();
  }

  wadah.append(el('div', { class: 'umpan' },
    tombol('Membantu', 'membantu', ikon('jempol')), tombol('Tidak membantu', 'tidak_membantu', ikon('jempol', 'ikon-turun')),
    hasil.angka?.length ? tombol('Laporkan angka salah', 'angka_salah', ikon('bendera')) : null));
  return wadah;
}

/* ---------- Kartu jawaban ---------- */
function bukaPengaturanAI() {
  bukaSheet('Tentang Tanya AI & Mode', 'pengaturan', el('div', {},
    el('p', {}, 'Tanya AI menjelaskan data anggaran dengan bahasa sehari-hari. Angka, grafik, dan rujukannya diambil dari data yang tersedia.'),
    el('p', {}, 'Jika layanan AI online belum tersedia atau gagal validasi, aplikasi menampilkan Mode Dasar. Saat perangkat tidak terhubung ke internet, aplikasi masuk ke Mode Offline menggunakan paket belajar lokal.'),
    el('p', {}, 'Pengelola mengaktifkan layanan AI melalui konfigurasi server; kamu tidak perlu memasukkan kunci API.')
  ));
}

function kepalaJawaban(hasil) {
  const modePill = hasil.mode === 'data_resmi'
    ? el('span', { class: 'mode' }, 'Data dokumen resmi')
    : hasil.ai
    ? el('span', { class: 'mode', title: 'AI menjelaskan; semua angka diisi program dari tabel fakta' }, 'AI · angka dari tabel fakta')
    : hasil.mode === 'offline'
    ? el('span', { class: 'mode offline', style: 'cursor:pointer', onclick: bukaPengaturanAI, title: hasil.catatan_mode || 'Menjawab dari paket belajar lokal' }, 'Mode Offline')
    : el('span', { class: 'mode dasar', style: 'cursor:pointer', onclick: bukaPengaturanAI, title: hasil.catatan_mode ? `${hasil.catatan_mode} (Ketuk untuk informasi)` : 'AI sedang tidak aktif; ketuk untuk informasi' }, 'Mode dasar');

  return el('div', { class: 'jawaban-kepala' },
    el('span', { class: 'avatar', 'aria-hidden': 'true' }, ikon('kilau')),
    el('strong', {}, 'Transkeu'),
    modePill,
    !hasil.ai && hasil.catatan_mode ? el('span', { class: 'catatan-kecil' }, hasil.catatan_mode) : null);
}

function chipsLanjutan(daftar) {
  if (!daftar?.length) return null;
  return el('div', {}, el('div', { class: 'judul-kecil' }, ikon('tanya'), 'Tanya lanjut'),
    el('div', { class: 'chips' }, daftar.map((q) => el('button', { type: 'button', class: 'chip', onclick: () => tanya(q) }, q))));
}

function paragrafBersumber(hasil, sudah) {
  if (!hasil.paragraf?.length) return el('p', { class: 'ringkas' }, teksBeristilah(hasil.ringkas, sudah));
  const sources = new Map((hasil.sumber ?? []).map(s => [s.id, s]));
  return el('div', { class: 'narasi-ai' }, hasil.paragraf.map(p => el('div', { class: 'paragraf-ai' },
    el('p', { class: 'ringkas' }, teksBeristilah(p.teks, sudah)),
    el('div', { class: 'rujukan-paragraf' }, (p.source_ids ?? []).map(id => {
      const source = sources.get(id);
      if (!source) return null;
      return el('button', { type: 'button', class: 'chip sumber-paragraf', onclick: () => {
        if (source.fakta) bukaSumber(source.fakta);
        else bukaSheet(source.judul, 'kamus', el('p', {}, source.teks), el('p', { class: 'catatan-kecil' }, 'Materi edukasi internal Transkeu.ID; bukan kutipan resmi pemerintah.'));
      } }, source.jenis === 'kamus' ? 'Kamus: ' + source.judul.replace('Kamus Transkeu.ID: ', '') : 'Periksa sumber: ' + source.judul);
    }))
  )));
}

function navigasiLatihan(idLatihan) {
  pindahTab('kuis');
  const elLatihan = document.getElementById(`latihan-${idLatihan}`) ?? $('latihan-wadah');
  elLatihan?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function kartuJawaban(pertanyaan, hasil) {
  const sudah = new Set();
  if (hasil.status === 'istilah') {
    return el('article', { class: 'kartu jawaban' }, kepalaJawaban(hasil),
      el('p', { class: 'ringkas' }, el('strong', {}, hasil.istilah.istilah), `: ${hasil.istilah.arti}`),
      hasil.istilah.contoh ? el('p', { class: 'batasan' }, hasil.istilah.contoh) : null,
      renderInstansi(hasil.belanja_instansi, { el, onBukaSumber: bukaSumber, onTanya: tanya, onAspirasi: (rows, topic) => mulaiAspirasi(rows, topic) }),
      renderImpacts(hasil.hasil_lapangan, { el }),
      renderArticles(hasil.bacaan_terkait, { el }),
      renderClaimCheck(hasil.pemeriksaan_klaim, { el }),
      chipsLanjutan(hasil.lanjutan),
      umpanBalik(pertanyaan, hasil));
  }
  if (hasil.status === 'tidak_tersedia') {
    return el('article', { class: 'kartu jawaban tidak-tersedia' }, kepalaJawaban(hasil),
      el('p', { class: 'ringkas' }, ikon('peringatan'), el('span', {}, hasil.pesan ?? PESAN_TIDAK_TERSEDIA)),
      hasil.alasan ? el('p', {}, hasil.alasan) : null,
      hasil.topikSaran?.length
        ? el('div', {},
            el('div', { class: 'judul-kecil' }, 'Topik tersedia di paket'),
            el('div', { class: 'chips' }, hasil.topikSaran.map((s) => el('button', { type: 'button', class: 'chip', onclick: () => tanya(s) }, s))))
        : null,
      el('a', {
        class: 'tombol',
        href: hasil.portal.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        onclick: (e) => {
          if (sedangOffline()) {
            e.preventDefault();
            toast('Portal resmi memerlukan koneksi internet.');
          }
        },
      }, ikon('keluar'), `Buka ${hasil.portal.nama} `, el('span', { class: 'badge-internet' }, 'Perlu internet')),
      renderInstansi(hasil.belanja_instansi, { el, onBukaSumber: bukaSumber, onTanya: tanya, onAspirasi: (rows, topic) => mulaiAspirasi(rows, topic) }),
      renderImpacts(hasil.hasil_lapangan, { el }),
      renderArticles(hasil.bacaan_terkait, { el }),
      renderClaimCheck(hasil.pemeriksaan_klaim, { el }),
      chipsLanjutan(hasil.lanjutan),
      umpanBalik(pertanyaan, hasil));
  }

  return el('article', { class: 'kartu jawaban' },
    kepalaJawaban(hasil),
    paragrafBersumber(hasil, sudah),
    hasil.visual_warning && el('p', { class: 'catatan-kecil' }, 'Grafik tidak ditampilkan karena cakupan atau periode datanya belum sebanding. Angkanya tetap dapat diperiksa pada sumber.'),
    hasil.visual && renderVisual(hasil.visual, { onBukaSumber: bukaSumber, el }),
    hasil.angka.length > 0 && el('div', {}, el('div', { class: 'judul-kecil' }, ikon('topik'), 'Angka utama'),
      el('ul', { class: 'daftar-angka' }, hasil.angka.map((b) => barisAngka(b, sudah)))),
    hasil.hitung && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('hitung'), 'Cara menghitung'),
      el('p', { class: 'rumus' }, hasil.hitung.rumus),
      el('p', { class: 'catatan-kecil', style: 'margin-top:6px' }, `Dihitung oleh program, bukan AI. ${hasil.hitung.keterangan}`)),
    hasil.kegunaan?.length > 0 && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('daftar'), 'Untuk apa dananya'),
      el('ul', { class: 'biasa' }, hasil.kegunaan.map((k) => el('li', {}, teksBeristilah(k.teks, sudah), ' ',
        el('button', { type: 'button', class: 'istilah-tag', onclick: () => bukaSumber({ ...k, pos: k.teks, nilai: null }) }, '(Cek sumber)'))))),
    hasil.istilah?.length > 0 && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('kamus'), 'Istilah di jawaban ini'),
      el('div', { class: 'chips' }, hasil.istilah.map((i) => el('button', { type: 'button', class: 'chip', onclick: () => bukaIstilah(i) }, i.istilah)))),
    hasil.angka.length > 0 && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('dokumen'), 'Sumber'),
      el('ul', { class: 'sumber-list' }, hasil.angka.map((b, n) => el('li', {},
        el('button', { type: 'button', class: 'tombol-sumber', onclick: () => bukaSumber(b) },
          el('span', { class: 'no' }, `[${n + 1}]`), el('span', { class: 'teks' }, `${labelJenis(b)}: ${judulSumber(b)}`), ikon('panah')))))),
    (hasil.angka?.length > 0 || hasil.jejakTerkait || hasil.latihanTerkait) && el('div', { class: 'chips aksi-bukti' },
      hasil.angka?.length > 0 ? el('button', { type: 'button', class: 'chip', onclick: () => mulaiAspirasi(hasil.angka) }, 'Susun aspirasi dari bukti ini') : null,
      hasil.angka?.length > 0 || hasil.jejakTerkait ? el('button', { type: 'button', class: 'chip', onclick: () => { tampilJejak(hasil.angka?.[0]?.topik ?? 'pendidikan'); pindahTab('jejak'); window.scrollTo(0, 0); } }, 'Telusuri program di Jejak Anggaran') : null,
      hasil.latihanTerkait || hasil.angka?.[0]?.topik === 'pendidikan' ? el('button', { type: 'button', class: 'chip', onclick: () => navigasiLatihan('latihan-pip-cakupan') }, 'Latihan sumber terkait') : null),
    hasil.batasan?.length > 0 && el('div', { class: 'batasan' }, el('div', { class: 'judul-kecil', style: 'margin:0' }, ikon('info'), 'Batasan'), hasil.batasan.map((t) => el('p', {}, t))),
    renderInstansi(hasil.belanja_instansi, { el, onBukaSumber: bukaSumber, onTanya: tanya, onAspirasi: (rows, topic) => mulaiAspirasi(rows, topic) }),
    renderImpacts(hasil.hasil_lapangan, { el }),
    renderArticles(hasil.bacaan_terkait, { el }),
    renderClaimCheck(hasil.pemeriksaan_klaim, { el }),
    chipsLanjutan(hasil.lanjutan),
    umpanBalik(pertanyaan, hasil),
  );
}

/* ---------- Tanya (AI di server, mesin aturan sebagai cadangan / Mode Offline) ---------- */
const riwayatAI = [];
let sedangMenjawab = false;

function jawabLokal(pertanyaan, mode = 'dasar', catatan) {
  const inst = hasilInstansi(pertanyaan, riwayatAI);
  const hasil = inst ?? jawab(pertanyaan, data, riwayatAI);
  return {
    ...hasil,
    ai: false,
    mode: inst && mode !== 'offline' ? inst.mode : mode,
    catatan_mode: catatan ?? (mode === 'offline'
      ? 'Perangkat sedang offline. Menjawab dari paket belajar lokal.'
      : 'Layanan AI belum bisa dihubungi. Jawaban ini memakai Mode Dasar.'),
  };
}

async function tanyaServer(pertanyaan, konteks_lapangan = {}) {
  // Jika perangkat offline, langsung layani secara lokal (Mode Offline) dan JANGAN antrekan permintaan.
  if (sedangOffline()) {
    return jawabLokal(pertanyaan, 'offline', 'Perangkat sedang offline. Menjawab dari paket belajar lokal (pencarian fakta & istilah).');
  }

  try {
    const r = await fetch('/api/tanya', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pertanyaan,
        riwayat: riwayatAI.slice(-3),
        konteks_lapangan,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (r.status === 429) toast('Batas pertanyaan AI hari ini habis. Jawaban memakai mode dasar.');
    if (!r.ok) return jawabLokal(pertanyaan, 'dasar', 'Layanan AI belum bisa dihubungi. Jawaban ini memakai Mode Dasar.');
    const result = await r.json();
    if (!['ok', 'istilah', 'klarifikasi', 'tidak_tersedia'].includes(result?.status)) throw new Error('Respons tidak sesuai');
    return result;
  } catch {
    if (sedangOffline()) {
      return jawabLokal(pertanyaan, 'offline', 'Koneksi terputus. Menjawab dari paket belajar lokal.');
    }
    return jawabLokal(pertanyaan, 'dasar', 'Layanan AI belum bisa dihubungi. Jawaban ini memakai Mode Dasar.');
  }
}

function aturChips(daftar) {
  $('chips').replaceChildren(...daftar.map((q) => el('button', { type: 'button', class: 'chip', onclick: () => tanya(q) }, q)));
}

async function tanya(pertanyaan, konteks_lapangan = {}) {
  const q = pertanyaan.trim();
  if (!q || sedangMenjawab) return;
  sedangMenjawab = true;
  pindahTab('tanya');
  $('sapa')?.remove();
  const gelembung = el('p', { class: 'gelembung' }, q);
  const memuat = el('div', { class: 'kartu jawaban memuat', role: 'status' }, el('span', { class: 'titik-titik', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')), sedangOffline() ? 'Mencari di paket belajar offline…' : 'Transkeu sedang membaca dokumen…');
  $('obrolan').append(gelembung, memuat);
  gelembung.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const hasil = (await tanyaServer(q, konteks_lapangan)) ?? jawabLokal(q, sedangOffline() ? 'offline' : 'dasar');
  const kartu = kartuJawaban(q, hasil);
  memuat.replaceWith(kartu);
  if (hasil.status === 'ok') riwayatAI.push({ tanya: q, jawab: hasil.ringkas });
  aturChips(hasil.lanjutan?.length ? hasil.lanjutan : contohAwal);
  simpan.tulis('transkeu.riwayat', [...new Set([q, ...simpan.baca('transkeu.riwayat', [])])].slice(0, 8));
  sedangMenjawab = false;
}

function sapa() {
  const terakhir = simpan.baca('transkeu.riwayat', []);
  try { localStorage.removeItem('transkeu.api_key'); } catch { /* penyimpanan opsional */ }
  return el('div', { class: 'sapa', id: 'sapa' },
    el('img', { class: 'avatar-besar logo-avatar', src: 'assets/logo.jpg', alt: 'Logo Transkeu.ID' }),
    el('h2', {}, 'Halo, aku Transkeu'),
    el('p', {}, 'Aku membantu menjelaskan ke mana uang rakyat di APBN dipakai dengan bahasa sehari-hari. Setiap angka dan grafik bisa kamu cek sumber resminya.'),
    el('div', { style: 'margin: 12px 0' },
      el('button', {
        type: 'button',
        class: 'chip',
        style: 'border-color:var(--biru-500);background:var(--biru-50);color:var(--biru-900);font-weight:700',
        onclick: bukaPengaturanAI,
      }, sedangOffline() ? 'Mode Offline Aktif · Paket Belajar Lokal' : 'Tentang Tanya AI & Mode')
    ),
    el('div', { class: 'saran' }, contohAwal.map((q) => el('button', { type: 'button', onclick: () => tanya(q) }, q))),
    terakhir.length ? el('div', { style: 'margin-top:20px' }, el('div', { class: 'judul-kecil', style: 'justify-content:center' }, 'Pertanyaanmu sebelumnya'),
      el('div', { class: 'saran' }, terakhir.slice(0, 4).map((q) => el('button', { type: 'button', onclick: () => tanya(q) }, q)))) : null);
}

$('form-tanya').addEventListener('submit', (e) => {
  e.preventDefault();
  tanya($('input-tanya').value);
  $('input-tanya').value = '';
});
$('hero-cari').addEventListener('submit', (e) => {
  e.preventDefault();
  tanya($('hero-input').value);
  $('hero-input').value = '';
});

// Kolom tanya tetap di bawah; ruang di bawah konten mengikuti tingginya.
new ResizeObserver(([e]) => document.documentElement.style.setProperty('--tinggi-tanya', `${e.target.offsetHeight}px`)).observe($('tanya-bar'));

/* ---------- Tab ---------- */
function pindahTab(nama) {
  document.body.dataset.tab = nama;
  for (const t of document.querySelectorAll('[role=tab]')) {
    const aktif = t.id === `t-${nama}`;
    t.setAttribute('aria-selected', String(aktif));
    $(t.getAttribute('aria-controls')).hidden = !aktif;
  }
}
for (const t of document.querySelectorAll('[role=tab]')) t.addEventListener('click', () => { pindahTab(t.id.slice(2)); window.scrollTo(0, 0); });

/* ---------- Paket Belajar Offline & PWA ---------- */
const kotakOffline = el('div', { class: 'bagian', id: 'paket-offline-bagian' });
let progresUnduh = null;
let sedangUnduh = false;
let konfirmasiHapusLokal = false;

function perbaruiBannerOffline() {
  const meta = bacaStatusPaket();
  const siap = Boolean(meta?.siap);
  const statusTeks = sedangUnduh
    ? `Mengunduh (${progresUnduh?.persen ?? 0}%)`
    : siap
    ? 'Siap offline'
    : 'Belum diunduh';

  const progresEl = sedangUnduh
    ? el('div', { class: 'progres', role: 'progressbar', 'aria-valuenow': String(progresUnduh?.persen ?? 0), 'aria-valuemin': '0', 'aria-valuemax': '100' },
        el('div', { class: 'jalur' }, el('span', { style: `width:${progresUnduh?.persen ?? 0}%` })),
        el('div', { class: 'progres-teks' }, el('span', {}, progresUnduh?.berkas ?? 'Mempersiapkan berkas…'), el('strong', {}, `${progresUnduh?.persen ?? 0}%`)))
    : null;

  const tombolUnduh = el('button', {
    type: 'button',
    class: 'tombol tombol-utama',
    disabled: sedangUnduh,
    onclick: async () => {
      if (sedangUnduh) return;
      if (sedangOffline()) return toast('Sambungkan internet sebentar untuk mengunduh atau memperbarui paket belajar.');
      sedangUnduh = true;
      progresUnduh = { persen: 0, berkas: 'Memulai unduhan…' };
      perbaruiBannerOffline();
      try {
        const hasil = await unduhPaketOffline({
          onProgress: (p) => {
            progresUnduh = p;
            perbaruiBannerOffline();
          },
        });
        toast(`Paket belajar offline siap (${formatUkuranByte(hasil.ukuranBytes)}).`);
      } catch (err) {
        toast(`Unduhan terputus: ${err.message}. Paket lama dan data belajarmu tetap aman.`);
      } finally {
        sedangUnduh = false;
        progresUnduh = null;
        perbaruiBannerOffline();
        perbaruiIndikatorJaringan();
      }
    },
  }, ikon('masuk'), siap ? 'Perbarui paket belajar offline' : 'Unduh paket belajar offline');

  const tombolInstall = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: async () => {
      if (promptInstallPWA) {
        promptInstallPWA.prompt();
        await promptInstallPWA.userChoice.catch(() => {});
        promptInstallPWA = null;
        perbaruiBannerOffline();
      } else {
        bukaSheet('Pasang sebagai aplikasi (PWA)', 'masuk',
          el('p', {}, 'Di Chrome/Edge ponsel atau komputer, buka menu peramban lalu pilih "Install App" atau "Tambahkan ke Layar Utama".'),
          el('p', { class: 'catatan-kecil' }, 'Setelah paket belajar diunduh, aplikasi terpasang tetap dapat dibuka untuk belajar Pendidikan & PIP, Jejak Anggaran, Kamus, Kuis, dan Aspirasi Data saat offline.')
        );
      }
    },
  }, promptInstallPWA ? 'Pasang Aplikasi (PWA)' : 'Cara pasang PWA');

  const tombolHapusPaket = siap ? el('button', {
    type: 'button',
    class: 'tombol',
    onclick: async () => {
      await hapusPaketOffline();
      perbaruiBannerOffline();
      perbaruiIndikatorJaringan();
      toast('Cache paket offline dihapus. Skor kuis dan draf aspirasimu tetap aman.');
    },
  }, 'Hapus cache paket') : null;

  const tombolHapusSemua = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: async () => {
      if (!konfirmasiHapusLokal) {
        konfirmasiHapusLokal = true;
        perbaruiBannerOffline();
        toast('Ketuk sekali lagi untuk menghapus paket offline, skor kuis, dan draf aspirasi.');
        setTimeout(() => { konfirmasiHapusLokal = false; perbaruiBannerOffline(); }, 5000);
        return;
      }
      konfirmasiHapusLokal = false;
      await hapusSemuaDataLokal();
      tampilAspirasi();
      tampilKuis();
      perbaruiBannerOffline();
      perbaruiIndikatorJaringan();
      toast('Paket offline, skor kuis, dan draf lokal berhasil dihapus.');
    },
  }, konfirmasiHapusLokal ? 'Konfirmasi hapus semua data lokal' : 'Hapus data lokal');

  kotakOffline.replaceChildren(
    el('div', { class: 'kartu paket-offline-kartu' },
      el('div', { class: 'paket-atas' },
        el('div', {},
          el('div', { class: 'judul-kecil', style: 'margin-bottom:4px' }, ikon('masuk'), 'Akses Koneksi Terbatas · PWA'),
          el('h3', { style: 'font-size:19px;font-weight:800' }, 'Paket belajar offline')),
        el('span', { class: `paket-status ${siap ? 'siap' : 'belum'}` }, statusTeks)),
      el('p', { class: 'catatan-kecil' }, `Versi data v${PAKET_META.versi} · Pembaruan ${PAKET_META.tanggalPembaruan} · Ukuran: ${formatUkuranByte(meta?.ukuranBytes)} · Mencakup Beranda, contoh Pendidikan & PIP, Jejak Anggaran, Kamus, Latihan/Kuis, dan draf Aspirasi.`),
      progresEl,
      el('div', { class: 'chips' }, tombolUnduh, tombolInstall, tombolHapusPaket, tombolHapusSemua),
      el('p', { class: 'catatan-kecil' }, 'Skor kuis dan draf aspirasi disimpan terpisah dari cache aplikasi agar tidak terhapus saat paket diperbarui. Tautan PDF penuh tetap berlabel "Perlu internet".')
    )
  );
}

verifikasiCacheUtuh().then(() => {
  perbaruiBannerOffline();
  perbaruiIndikatorJaringan();
}).catch(() => {});

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', () => { perbaruiIndikatorJaringan(); perbaruiBannerOffline(); });
  window.addEventListener('offline', () => { perbaruiIndikatorJaringan(); perbaruiBannerOffline(); });
}

/* ---------- Beranda: ke mana uang rakyat dipakai ---------- */
function kepalaBagian(lencana, judul, sub, namaIkon) {
  return el('div', { class: 'kepala-bagian' }, el('span', { class: 'lencana' }, ikon(namaIkon), lencana), el('h2', {}, judul), sub ? el('p', {}, sub) : null);
}

function angkaBesar(b, label) {
  return el('button', { type: 'button', class: 'angka-besar', onclick: () => bukaSumber(b), 'aria-label': `${formatNilai(b)}. Lihat sumber` },
    el('span', { class: 'v' }, formatNilai(b)), el('small', {}, label ?? 'lihat sumber'));
}

function bagianArus() {
  const masuk = baris('umum-2026-pendapatan-anggaran');
  const keluar = baris('umum-2026-belanja-anggaran');
  const kurang = baris('umum-2026-defisit-anggaran');
  const item = (kelas, namaIkon, judul, b, jelas) => el('div', { class: 'arus-item' },
    el('span', { class: `arus-ikon ${kelas}`, 'aria-hidden': 'true' }, ikon(namaIkon)),
    el('div', {}, el('div', { class: 'arus-label' }, judul), angkaBesar(b), el('p', {}, jelas)));
  return el('div', { class: 'bagian' },
    kepalaBagian('APBN 2026', 'Dompet negara dalam satu layar', 'Seperti dompet keluarga: ada uang masuk, uang keluar, dan kekurangan yang harus ditutup.', 'gedung'),
    el('div', { class: 'kartu arus' },
      item('masuk', 'masuk', 'Uang masuk (pendapatan negara)', masuk, 'Terutama dari pajak yang kita bayar, ditambah penerimaan bukan pajak dan hibah.'),
      item('keluar', 'belanja', 'Uang keluar (belanja negara)', keluar, 'Dipakai pemerintah pusat dan dikirim ke daerah untuk layanan publik.'),
      item('kurang', 'kurang', 'Kekurangan (defisit)', kurang, 'Selisih belanja dan pendapatan, ditutup lewat pembiayaan seperti penerbitan surat utang.')));
}

function bagianPembagian() {
  const total = baris('umum-2026-belanja-anggaran');
  const bpp = baris('umum-2026-bpp-anggaran');
  const tkd = baris('umum-2026-tkd-anggaran');
  const fungsi = fakta.filter((f) => f.kelompok === 'belanja_fungsi').sort((a, b) => b.nilai - a.nilai);
  const maks = fungsi[0].nilai;
  const nama = (f) => {
    const n = f.pos.replace(/^Belanja fungsi /, '').replace(/ \(pemerintah pusat\)$/, '');
    return n[0].toUpperCase() + n.slice(1);
  };
  return el('div', { class: 'bagian' },
    kepalaBagian('Ke mana perginya', `Belanja ${formatNilai(total)} dibagi ke mana?`, 'Ketuk angka untuk melihat dokumen dan kutipannya.', 'peta'),
    el('div', { class: 'kartu' },
      el('div', { class: 'judul-kecil' }, 'Pusat dan daerah'),
      el('div', { class: 'batang-pecah', role: 'img', 'aria-label': `Belanja pemerintah pusat ${formatNilai(bpp)} dan transfer ke daerah ${formatNilai(tkd)}` },
        el('span', { style: `width:${(bpp.nilai / (bpp.nilai + tkd.nilai)) * 100}%` }), el('span', { style: 'flex:1' })),
      el('div', { class: 'legenda' },
        el('button', { type: 'button', onclick: () => bukaSumber(bpp) }, el('span', { class: 'titik', style: 'background:var(--biru-700)' }), el('span', { class: 'teks' }, 'Dibelanjakan pemerintah pusat', el('strong', {}, formatNilai(bpp)))),
        el('button', { type: 'button', onclick: () => bukaSumber(tkd) }, el('span', { class: 'titik', style: 'background:var(--langit)' }), el('span', { class: 'teks' }, 'Dikirim ke pemerintah daerah (transfer ke daerah)', el('strong', {}, formatNilai(tkd)))))),
    el('div', { class: 'kartu' },
      el('div', { class: 'judul-kecil' }, 'Belanja pemerintah pusat menurut fungsi'),
      el('ul', { class: 'fungsi-list' }, fungsi.map((f) => el('li', {},
        el('button', { type: 'button', onclick: () => bukaSumber(f), 'aria-label': `${nama(f)}: ${formatNilai(f)}. Lihat sumber` },
          el('span', { class: 'fungsi-atas' }, el('span', {}, nama(f)), el('strong', {}, formatNilai(f))),
          el('span', { class: 'jalur', 'aria-hidden': 'true' }, el('span', { style: `width:${(f.nilai / maks) * 100}%` })))))),
      el('p', { class: 'catatan-kecil', style: 'margin-top:12px' }, 'Belum termasuk transfer ke daerah. Rincian tiap fungsi ada di Lampiran UU APBN 2026.')));
}

function terbaru(daftar) {
  return [...daftar].sort((a, b) => (b.tahun_anggaran - a.tahun_anggaran) || (b.tanggal_posisi ?? '').localeCompare(a.tanggal_posisi ?? ''))[0];
}

function kartuTopik(t) {
  const semua = fakta.filter((f) => f.topik === t.id && !f.subtopik);
  const anggaran = terbaru(semua.filter((f) => f.jenis_angka === 'Anggaran'));
  const realisasi = terbaru(semua.filter((f) => f.jenis_angka === 'Realisasi'));
  const h = anggaran && realisasi ? persenRealisasi(realisasi, anggaran) : null;
  return el('article', { class: 'kartu kartu-topik' },
    el('div', { class: 'topik-kepala' }, el('span', { class: 'topik-ikon', 'aria-hidden': 'true' }, ikon(IKON_TOPIK[t.id])), el('h3', {}, t.nama)),
    anggaran
      ? el('div', {}, el('div', { class: 'catatan-kecil' }, `${anggaran.pos}, TA ${anggaran.tahun_anggaran}`), angkaBesar(anggaran))
      : el('p', { class: 'kosong-angka' }, `Anggaran: ${PESAN_TIDAK_TERSEDIA}`),
    h
      ? el('div', { class: 'progres' },
        el('div', { class: 'jalur', role: 'img', 'aria-label': `${h.teksHasil} terpakai` }, el('span', { style: `width:${Math.min(h.hasil, 100)}%` })),
        el('div', { class: 'progres-teks' }, el('span', {}, `Terpakai ${realisasi.posisi_data}`), el('strong', {}, h.teksHasil)))
      : realisasi
        ? el('p', { class: 'catatan-kecil' }, `Realisasi ${realisasi.posisi_data}: `, el('button', { type: 'button', class: 'istilah-tag', onclick: () => bukaSumber(realisasi) }, formatNilai(realisasi)), ` (${realisasi.pos.toLowerCase()}; cakupannya berbeda dengan anggaran di atas)`)
        : el('p', { class: 'catatan-kecil' }, `Realisasi: ${PESAN_TIDAK_TERSEDIA}`),
    el('button', { type: 'button', class: 'tombol-teks', onclick: () => tanya(t.contoh[0]) }, `Tanya soal ${t.nama.toLowerCase()}`, ikon('panah')));
}

$('saran-hero').append(...contohAwal.map((q) => el('button', { type: 'button', onclick: () => tanya(q) }, q)));
perbaruiBannerOffline();
$('isi-beranda').append(
  kotakOffline,
  bagianArus(),
  bagianPembagian(),
  bagianInstansi(),
  el('div', { class: 'bagian' },
    kepalaBagian('Topik populer', 'Enam topik yang paling sering ditanya', 'Anggaran, yang sudah terpakai, dan cara membacanya.', 'topik'),
    el('div', { class: 'grid-topik' }, topik.filter((t) => !t.tersembunyi).map(kartuTopik))),
  el('div', { class: 'bagian' },
    el('div', { class: 'kartu', style: 'display:grid;gap:12px' },
      el('h3', { style: 'font-size:20px;font-weight:800' }, 'Alur Demo Literasi & Pengawasan'),
      el('p', { class: 'catatan-kecil' }, 'Mulai dari pertanyaan pendidikan/PIP, telusuri pagu hingga bukti lapangan di Jejak Anggaran, uji kemampuan di Latihan/Kuis, atau susun draf Aspirasi Data.'),
      el('div', { class: 'chips' },
        el('button', { type: 'button', class: 'tombol tombol-utama', onclick: () => tanya('Bagaimana anggaran dan penyaluran PIP 2026?') }, ikon('kilau'), 'Demo tanya PIP 2026'),
        el('button', { type: 'button', class: 'tombol', onclick: () => { pindahTab('jejak'); window.scrollTo(0, 0); } }, ikon('jejak'), 'Jejak Anggaran'),
        el('button', { type: 'button', class: 'tombol', onclick: () => { pindahTab('aspirasi'); window.scrollTo(0, 0); } }, ikon('aspirasi'), 'Aspirasi Data')))),
  el('div', { class: 'bagian' },
    el('div', { class: 'kartu', style: 'display:grid;gap:12px' },
      el('h3', { style: 'font-size:20px;font-weight:800' }, 'Seberapa paham kamu soal APBN?'),
      el('p', { class: 'catatan-kecil' }, 'Kerjakan pre-test sebelum belajar, coba latihan membaca kartu sumber PIP, lalu selesaikan post-test.'),
      el('div', { class: 'chips' },
        el('button', { type: 'button', class: 'tombol tombol-utama', onclick: () => { pindahTab('kuis'); window.scrollTo(0, 0); } }, ikon('kuis'), 'Mulai kuis & latihan'),
        el('button', { type: 'button', class: 'tombol', onclick: () => { pindahTab('kamus'); window.scrollTo(0, 0); } }, ikon('kamus'), 'Buka kamus')))),
);

/* ---------- Jejak Anggaran (Paper: Pagu -> Realisasi -> Output -> Hasil/Dampak) ---------- */
function renderJejakStep(judul, dataStep, kelasBadge, statusCapaian = 'tersedia') {
  if (!dataStep) return null;
  const isCapaian = kelasBadge === 'capaian';
  const isBelum = statusCapaian === 'belum_tersedia' || dataStep.status === 'belum_tersedia';

  return el('div', { class: 'jejak-step-card' },
    el('div', { class: 'step-header' },
      el('span', { class: 'step-nomor' }, judul),
      el('span', { class: `step-badge step-badge-${isBelum ? 'belum' : kelasBadge}` },
        isBelum ? 'Belum dimuat' : (isCapaian ? 'Output Fisik' : (dataStep.satuan ?? ''))),
    ),
    el('div', { class: 'step-nilai' },
      isCapaian
        ? (isBelum ? 'Belum tersedia dalam katalog' : dataStep.output_fisik)
        : (dataStep.nilai != null ? formatNilai(dataStep) : 'Belum dirinci'),
    ),
    el('div', { class: 'step-label' }, dataStep.label),
    el('p', { class: 'catatan-kecil' }, `TA ${dataStep.tahun_anggaran} · Cakupan: ${dataStep.cakupan ?? 'mengikuti dokumen'}`),
    dataStep.dokumen && documentUrl(dataStep) && dataStep.halaman_atau_tabel && dataStep.kutipan
      ? el('button', {
          type: 'button',
          class: 'step-tombol-sumber',
          onclick: () => bukaSumber({
            ...dataStep,
            pos: dataStep.label,
            jenis_angka: isCapaian ? 'Capaian Output' : (kelasBadge === 'alokasi' ? 'Anggaran' : 'Realisasi'),
            tahun_anggaran: dataStep.tahun_anggaran,
          }),
        }, ikon('dokumen'), 'Lihat dokumen sumber')
      : null,
  );
}

function kartuJejak(item) {
  const trace = traceEvidence(item);
  const [alokasi, realisasi, capaian] = trace.stages;

  return el('article', { class: 'jejak-kartu' },
    el('div', { class: 'jejak-header' },
      el('div', { class: 'jejak-judul-blok' },
        el('span', { class: 'jejak-sektor-badge' }, `${item.sektor} · TA ${item.tahun_anggaran}`),
        el('h3', {}, item.nama),
        el('p', { class: 'jejak-deskripsi' }, item.deskripsi),
      ),
      el('button', {
        type: 'button',
        class: 'tombol-teks',
        onclick: () => tanya(`Bagaimana alokasi dan realisasi ${item.nama.toLowerCase()} TA ${item.tahun_anggaran}?`, { program_id: item.id, tahun_anggaran: item.tahun_anggaran }),
      }, 'Tanya AI', ikon('panah')),
    ),
    el('div', { class: 'jejak-alur jejak-alur-4' },
      renderJejakStep('1. Pagu (Alokasi)', alokasi, 'alokasi'),
      renderJejakStep('2. Realisasi Belanja', realisasi, 'realisasi'),
      renderJejakStep('3. Output Fisik', capaian, 'capaian', capaian.status),
      el('div', { class: 'jejak-step-card' },
        el('div', { class: 'step-header' },
          el('span', { class: 'step-nomor' }, '4. Hasil / Dampak'),
          el('span', { class: 'step-badge step-badge-belum' }, 'Belum tersedia'),
        ),
        el('div', { class: 'step-nilai' }, 'Bukti dampak belum tersedia'),
        el('div', { class: 'step-label' }, 'Evaluasi kausal dampak program di lapangan belum dimuat'),
        el('p', { class: 'catatan-kecil' }, 'Realisasi belanja atau jumlah penerima (output) tidak otomatis membuktikan dampak keberhasilan program.'),
      ),
    ),
    trace.warnings.map(teks => el('p', { class: 'batasan' }, teks)),
    trace.comparable && renderVisual({ tipe: 'batang', judul: `Pagu dan realisasi ${item.nama}`, satuan: alokasi.satuan, items: [alokasi, realisasi] }, { onBukaSumber: bukaSumber, el }),
    el('div', { class: 'chips' },
      el('button', { type: 'button', class: 'tombol', onclick: () => mulaiAspirasi(trace.stages, item.topik) }, 'Susun aspirasi dengan sumber program'),
      el('button', { type: 'button', class: 'tombol', onclick: () => tanya(`Apa hasil dan dampak ${item.nama} TA ${item.tahun_anggaran ?? 2026}?`, { program_id: item.id, tahun_anggaran: item.tahun_anggaran ?? 2026 }) }, 'Periksa bukti hasil dan dampak'),
    ),
    el('p', { class: 'jejak-catatan-kaki' },
      ikon('info'),
      el('strong', {}, ' Catatan Pengawasan: '),
      item.catatan_pengawasan,
    ),
  );
}

let filterJejakAktif = 'semua';
let filterProgramAktif = 'semua';
let filterTahunJejakAktif = 'semua';

function tampilJejak(filter = filterJejakAktif, programId = filterProgramAktif, tahun = filterTahunJejakAktif) {
  filterJejakAktif = filter;
  filterProgramAktif = programId;
  filterTahunJejakAktif = tahun;

  const daftarFilter = [
    { id: 'semua', nama: 'Semua Sektor' },
    { id: 'pendidikan', nama: 'Pendidikan' },
    { id: 'kesehatan', nama: 'Kesehatan' },
    { id: 'perlinsos', nama: 'Perlindungan Sosial' },
    { id: 'infrastruktur', nama: 'Infrastruktur' },
    { id: 'subsidi_energi', nama: 'Subsidi Energi' },
  ];

  const filterBar = el('div', { class: 'jejak-filters' },
    daftarFilter.map((f) => el('button', {
      type: 'button',
      class: 'jejak-filter-btn',
      'aria-pressed': String(f.id === filterJejakAktif),
      onclick: () => tampilJejak(f.id, 'semua', filterTahunJejakAktif),
    }, f.nama)),
  );

  const kandidatProgram = jejakAnggaran.filter((j) => filterJejakAktif === 'semua' || j.topik === filterJejakAktif);
  const pilihProgram = el('select', {
    class: 'tombol',
    'aria-label': 'Filter program Jejak Anggaran',
    onchange: (e) => tampilJejak(filterJejakAktif, e.target.value, filterTahunJejakAktif),
  },
    el('option', { value: 'semua', selected: filterProgramAktif === 'semua' }, 'Semua program'),
    ...kandidatProgram.map((j) => el('option', { value: j.id, selected: filterProgramAktif === j.id }, j.nama))
  );

  const semuaTahun = [...new Set(jejakAnggaran.flatMap((j) => [j.tahun_anggaran, j.tahap?.capaian?.status === 'tersedia' && j.id === 'jejak-subsidi-energi' ? 2025 : null].filter(Boolean)))].sort((a, b) => b - a);
  const pilihTahun = el('select', {
    class: 'tombol',
    'aria-label': 'Filter tahun anggaran Jejak Anggaran',
    onchange: (e) => tampilJejak(filterJejakAktif, filterProgramAktif, e.target.value),
  },
    el('option', { value: 'semua', selected: filterTahunJejakAktif === 'semua' }, 'Semua tahun tersedia'),
    ...semuaTahun.map((th) => el('option', { value: String(th), selected: filterTahunJejakAktif === String(th) }, `TA ${th}`))
  );

  const filterSekunder = el('div', { class: 'chips', style: 'margin-bottom:16px' }, pilihProgram, pilihTahun);

  const daftarItem = kandidatProgram.filter((j) =>
    (filterProgramAktif === 'semua' || j.id === filterProgramAktif) &&
    (filterTahunJejakAktif === 'semua' || String(j.tahun_anggaran) === filterTahunJejakAktif)
  );

  const wadahKartu = el('div', { class: 'jejak-list' },
    daftarItem.length
      ? daftarItem.map(kartuJejak)
      : el('div', { class: 'kartu' },
          el('p', { class: 'ringkas' }, `Belum ada entri program yang dimuat untuk filter tahun TA ${filterTahunJejakAktif}.`),
          el('button', { type: 'button', class: 'tombol', style: 'margin-top:10px', onclick: () => tampilJejak('semua', 'semua', 'semua') }, 'Tampilkan semua program'))
  );

  const disclaimerBox = el('div', { class: 'disclaimer-jejak' },
    ikon('peringatan'),
    el('strong', {}, ' Prinsip Akuntansi Sektor Publik: '),
    'Realisasi belanja mencerminkan penyerapan kas negara, ',
    el('strong', {}, 'bukan ukuran otomatis keberhasilan atau dampak program. '),
    'Rasio serapan hanya dihitung bila pagu dan realisasi memiliki tahun, satuan, dan cakupan program yang sama.',
  );

  $('jejak-anggaran').replaceChildren(
    kepalaBagian('Jejak Anggaran', 'Telusuri Dari Pagu Hingga Dampak', 'Empat tahap transparan: Pagu -> Realisasi -> Output Fisik -> Hasil/Dampak berdasarkan dokumen resmi.', 'jejak'),
    disclaimerBox,
    filterBar,
    filterSekunder,
    wadahKartu,
  );
}
tampilJejak();

/* ---------- Aspirasi Berbasis Data (Paper: Warga Mengawasi APBN) ---------- */
const KUNCI_ASPIRASI_DRAF = 'transkeu.aspirasi_draf';

function mulaiAspirasi(rows, topicOverride) {
  const proof = evidenceText(rows);
  if (!proof) return toast('Bukti dokumen belum lengkap untuk menyusun rujukan.');
  tampilAspirasi({ proof, topic: topicOverride ?? rows[0]?.topik, clearPreview: false });
  pindahTab('aspirasi');
  $('asp-data').scrollIntoView({ behavior: 'smooth' });
  toast('Data dan tautan sumber telah dimasukkan. Lengkapi masalah serta usulanmu.');
}

function tampilAspirasi(seed = {}) {
  const topikList = [
    'Pendidikan (Sekolah, PIP, KIP Kuliah, Fasilitas Belajar)',
    'Kesehatan (BPJS PBI, Layanan RS, Skrining Kesehatan)',
    'Perlindungan Sosial (PKH, Sembako, Bantuan Tunai)',
    'Infrastruktur (Jalan Rusak, Irigasi, Jembatan, Transportasi)',
    'Subsidi Energi (Ketersediaan Gas LPG 3kg, Listrik, BBM)',
    'Penerimaan Pajak & Tata Kelola Keuangan Negara',
    'Kebijakan APBN Umum & Anggaran Prioritas',
  ];

  const tersimpan = simpan.baca(KUNCI_ASPIRASI_DRAF, {});
  const nilaiTopik = seed.topic
    ? (topikList[['pendidikan', 'kesehatan', 'perlinsos', 'infrastruktur', 'subsidi_energi', 'pajak'].indexOf(seed.topic)] ?? topikList[0])
    : (tersimpan.topik ?? topikList[0]);

  const selectTopik = el('select', { id: 'asp-topik' },
    topikList.map((t) => el('option', { value: t, selected: t === nilaiTopik }, t)),
  );

  const inputLokasi = el('input', {
    type: 'text',
    id: 'asp-lokasi',
    placeholder: 'Contoh: Jakarta Timur (wilayah umum saja, tanpa alamat lengkap/NIK)',
    maxlength: '100',
  });
  inputLokasi.value = seed.lokasi ?? tersimpan.lokasi ?? '';

  const textMasalah = el('textarea', {
    id: 'asp-masalah',
    placeholder: 'Jelaskan kendala yang dialami (misal: "Siswa di lingkungan kami butuh penjelasan kejelasan penyaluran PIP...")',
    rows: '3',
    maxlength: '600',
    required: true,
  });
  textMasalah.value = seed.masalah ?? tersimpan.masalah ?? '';

  const textData = el('textarea', {
    id: 'asp-data',
    placeholder: 'Bukti angka dan sumber dari Transkeu.ID (misal: ketuk "Susun aspirasi dari bukti ini" di jawaban atau Jejak Anggaran)',
    rows: '3',
    maxlength: '12000',
  });
  textData.value = seed.proof ?? tersimpan.dataPendukung ?? '';

  const textBatas = el('textarea', {
    id: 'asp-batas',
    placeholder: 'Jelaskan batas bukti (misal: "Data APBN KiTa bersifat nasional per 30 September 2026; kondisi sekolah tertentu memerlukan data daerah.")',
    rows: '2',
    maxlength: '500',
  });
  textBatas.value = seed.batas ?? tersimpan.batasBukti ?? '';

  const textMasukan = el('textarea', {
    id: 'asp-masukan',
    placeholder: 'Apa usulan perbaikan yang diharapkan?',
    rows: '3',
    maxlength: '600',
    required: true,
  });
  textMasukan.value = seed.masukan ?? tersimpan.masukan ?? '';

  const simpanDrafLokal = (previewTeks) => {
    simpan.tulis(KUNCI_ASPIRASI_DRAF, {
      topik: selectTopik.value,
      lokasi: inputLokasi.value,
      masalah: textMasalah.value,
      dataPendukung: textData.value,
      batasBukti: textBatas.value,
      masukan: textMasukan.value,
      preview: previewTeks ?? simpan.baca(KUNCI_ASPIRASI_DRAF, {}).preview ?? '',
      diperbarui: new Date().toISOString(),
    });
  };

  for (const field of [selectTopik, inputLokasi, textMasalah, textData, textBatas, textMasukan]) {
    field.addEventListener('input', () => simpanDrafLokal());
    field.addEventListener('change', () => simpanDrafLokal());
  }
  if (seed.proof) simpanDrafLokal();

  const wadahDraf = el('div', { class: 'draf-hasil-wadah', hidden: !tersimpan.preview });
  const previewDraf = el('div', { class: 'draf-preview' }, tersimpan.preview ?? '');

  const tombolSalin = el('button', {
    type: 'button',
    class: 'tombol tombol-utama',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(previewDraf.textContent);
        toast('Draf aspirasi berhasil disalin ke papan klip!');
      } catch {
        toast('Gagal menyalin otomatis. Silakan salin teks secara manual.');
      }
    },
  }, ikon('salin'), 'Salin Draf Aspirasi');

  const tombolUnduhDraf = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: () => {
      const a = el('a', {
        href: URL.createObjectURL(new Blob([previewDraf.textContent], { type: 'text/plain;charset=utf-8' })),
        download: 'draf-aspirasi-transkeu.txt',
      });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Draf diunduh ke perangkat (offline).');
    },
  }, ikon('dokumen'), 'Unduh Draf (.txt)');

  const tombolTutupDraf = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: () => { wadahDraf.hidden = true; },
  }, 'Tutup Draf');

  wadahDraf.append(
    el('div', { class: 'judul-kecil' }, ikon('dokumen'), 'Pratinjau Draf Surat Aspirasi'),
    previewDraf,
    el('div', { class: 'draf-tombol-bar' }, tombolSalin, tombolUnduhDraf, tombolTutupDraf),
  );

  const tombolBersihkan = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: () => {
      simpan.tulis(KUNCI_ASPIRASI_DRAF, {});
      tampilAspirasi({ proof: '', lokasi: '', masalah: '', batas: '', masukan: '' });
      toast('Draf lokal dibersihkan.');
    },
  }, 'Bersihkan Draf');

  const form = el('form', {
    class: 'form-aspirasi kartu',
    onsubmit: (e) => {
      e.preventDefault();
      if (!textMasalah.value.trim() || !textMasukan.value.trim()) {
        return toast('Harap isi masalah dan masukan Anda.');
      }
      const draf = susunDrafAspirasi({
        topik: selectTopik.value,
        masalah: textMasalah.value,
        dataPendukung: textData.value,
        batasBukti: textBatas.value,
        masukan: textMasukan.value,
        lokasi: inputLokasi.value,
      });
      previewDraf.textContent = draf;
      wadahDraf.hidden = false;
      simpanDrafLokal(draf);
      wadahDraf.scrollIntoView({ behavior: 'smooth' });
      toast('Draf aspirasi disusun dan tersimpan di perangkat ini!');
    },
  },
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-topik' }, '1. Pilih Topik Pelayanan Publik'), selectTopik),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-lokasi' }, '2. Wilayah Umum (Opsional, tanpa alamat lengkap/NIK)'), inputLokasi),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-masalah' }, '3. Masalah yang Dialami'), textMasalah),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-data' }, '4. Bukti Data & Sumber Resmi (dari Transkeu.ID)'), textData),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-batas' }, '5. Batas Bukti (Opsional — otomatis diisi jika kosong)'), textBatas),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-masukan' }, '6. Usulan Perbaikan'), textMasukan),
    el('div', { class: 'draf-tombol-bar' },
      el('button', { type: 'submit', class: 'tombol tombol-utama' }, ikon('kirim'), 'Susun & Simpan Draf di Perangkat'),
      tombolBersihkan,
    ),
  );

  const daftarKanal = el('div', { class: 'kanal-aspirasi-wadah' },
    kepalaBagian('Kanal Resmi Pemerintah', 'Kirimkan Aspirasi Anda Secara Mandiri Saat Online', 'Transkeu.ID tidak mengirim data aspirasi secara otomatis dan tidak menyimpan draf di server. Salin atau unduh draf Anda, lalu buka kanal resmi berikut saat online:', 'keluar'),
    el('div', { class: 'kanal-grid' },
      kanalResmi.map((k) => el('a', {
        href: k.url,
        class: 'kanal-card',
        target: '_blank',
        rel: 'noopener noreferrer',
        onclick: (e) => {
          if (sedangOffline()) {
            e.preventDefault();
            toast('Membuka kanal resmi memerlukan internet. Drafmu sudah tersimpan aman di perangkat.');
          }
        },
      },
        el('h4', {}, k.nama, el('span', { class: 'badge-internet' }, 'Perlu internet')),
        el('p', { class: 'instansi' }, k.instansi),
        el('p', { class: 'fungsi' }, k.kegunaan),
      )),
    ),
  );

  $('aspirasi-data').replaceChildren(
    kepalaBagian('Aspirasi Berbasis Data', 'Susun Masukan Warga dengan Bukti Resmi', 'Bawa fakta dan kutipan dari Jejak Anggaran atau Tanya AI ke templat terstruktur. Berfungsi penuh offline.', 'aspirasi'),
    el('div', { class: 'aspirasi-intro kartu' },
      el('p', {}, 'Urutan draf: Masalah -> Bukti -> Batas Bukti -> Usulan. ', el('strong', {}, PERINGATAN_PRIVASI_ASPIRASI)),
    ),
    form,
    wadahDraf,
    daftarKanal,
  );
}
tampilAspirasi();

/* ---------- Kamus ---------- */
function tampilKamus(filter = '') {
  const cocok = cariKamus(istilah, filter);
  $('daftar-istilah').replaceChildren(...(cocok.length
    ? cocok.map((i) => el('div', {},
        el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px' },
          el('dt', {}, i.istilah, i.alias?.length ? ` (${i.alias.join(', ')})` : ''),
          el('button', { type: 'button', class: 'tombol-teks', style: 'font-size:13px;white-space:nowrap;min-height:36px', onclick: () => tanya(`Apa itu ${i.istilah}?`) }, 'Tanyakan', ikon('panah'))),
        i.sinonim?.length ? el('p', { class: 'catatan-kecil', style: 'margin-top:2px' }, `Sinonim: ${i.sinonim.join(', ')}`) : null,
        el('dd', {}, i.arti),
        i.contoh ? el('p', { class: 'catatan-kecil', style: 'margin-top:8px;background:var(--biru-50);padding:8px 10px;border-radius:10px' }, i.contoh) : null,
        i.terkait?.length
          ? el('div', { class: 'chips', style: 'margin-top:8px' }, i.terkait.map((nama) => {
              const target = istilah.find((x) => x.istilah.toLowerCase() === nama.toLowerCase());
              return target ? el('button', { type: 'button', class: 'chip', style: 'min-height:34px;font-size:12px', onclick: () => bukaIstilah(target) }, nama) : null;
            }))
          : null,
      ))
    : [el('p', { class: 'catatan-kecil' }, 'Istilah tidak ditemukan. Coba kata lain seperti pagu, realisasi, tanggal posisi, atau PIP.')]));
}
$('cari-istilah').addEventListener('input', (e) => tampilKamus(e.target.value));
tampilKamus();

/* ---------- Kuis, Latihan Sumber & Evaluasi Pilot ---------- */
function tampilKuis() {
  const raw = simpan.baca('transkeu.kuis', {});
  const state = migrasiSkorKuis(raw);
  const latihanState = simpan.baca('transkeu.latihan', {});
  if (!state.pesertaKode) {
    state.pesertaKode = buatKodePeserta();
    simpan.tulis('transkeu.kuis', { ...state, versi: VERSI_SOAL });
  }

  const ringkas = ringkasPerubahanPilot(state);
  const tahap = !state.sebelum ? 'sebelum' : (!state.sesudah ? 'sesudah' : 'selesai');
  const soalAktif = tahap === 'sebelum' ? kuisSetA : kuisSetB;

  const kartuSkor = el('div', { class: 'kartu', style: 'margin-bottom:16px;display:grid;gap:12px' },
    el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' },
      el('strong', {}, 'Evaluasi Pilot Mahasiswa UNJ (Tanpa Nama)'),
      el('span', { class: 'mode' }, `Kode peserta: ${state.pesertaKode} · ${VERSI_SOAL}`),
    ),
    el('p', { class: 'catatan-kecil' }, 'Set A (Pre-test) dan Set B (Post-test) memiliki 5 soal paralel dengan kompetensi dan bobot setara. Pembahasan Pre-test dibuka setelah Post-test selesai agar pola jawaban tidak bocor.'),
    el('div', { class: 'skor' },
      el('div', {}, 'Tes Sebelum (Set A)', el('strong', {}, state.sebelum ? `${state.sebelum.skor}/${state.sebelum.total} (${state.sebelum.persen}%)` : '–')),
      el('div', {}, 'Tes Sesudah (Set B)', el('strong', {}, state.sesudah ? `${state.sesudah.skor}/${state.sesudah.total} (${state.sesudah.persen}%)` : '–')),
    ),
    ringkas.perubahanPoinPersentase != null
      ? el('p', { class: ringkas.perubahanPoinPersentase >= 0 ? 'benar' : 'salah' },
          `Perubahan skor: ${ringkas.perubahanPoinPersentase >= 0 ? '+' : ''}${ringkas.perubahanPoinPersentase} poin persentase (${state.sebelum.persen}% → ${state.sesudah.persen}%)`)
      : null,
    ringkas.kompetensiPerluDilatih.length > 0
      ? el('div', { class: 'batasan' },
          el('strong', {}, 'Kompetensi yang perlu dilatih:'),
          el('ul', { class: 'biasa' }, ringkas.kompetensiPerluDilatih.map((k) => el('li', {}, k.label))),
        )
      : (ringkas.sudahPost ? el('p', { class: 'benar' }, 'Seluruh kompetensi uji pada set ini dijawab benar.') : null),
    el('div', { class: 'chips' },
      state.sebelum ? el('button', {
        type: 'button',
        class: 'tombol',
        onclick: () => {
          const payload = eksporHasilPilot(state, latihanState, state.pesertaKode);
          const a = el('a', {
            href: URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })),
            download: `transkeu-pilot-${state.pesertaKode}.json`,
          });
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          toast('Hasil pilot berpasangan (tanpa nama) diunduh.');
        },
      }, ikon('dokumen'), 'Unduh hasil berpasangan (JSON)') : null,
      state.sebelum ? el('button', {
        type: 'button',
        class: 'tombol',
        onclick: () => {
          simpan.tulis('transkeu.kuis', { versi: VERSI_SOAL, pesertaKode: buatKodePeserta(), sebelum: null, sesudah: null });
          tampilKuis();
        },
      }, 'Ulang tes dari awal') : null,
    ),
    el('p', { class: 'catatan-kecil' }, 'Catatan evaluasi pilot: target rekrutmen adalah minimal 30 mahasiswa UNJ; skor disimpan lokal di perangkat ini tanpa nama, dan pengukuran pengguna aktif harian lintas perangkat belum tersedia terpusat.'),
  );

  // Bagian Latihan Bertingkat Berbasis Kartu Sumber (terpisah dari skor Pre/Post)
  const wadahLatihan = el('section', { class: 'bagian', id: 'latihan-wadah', style: 'margin-bottom:20px' },
    kepalaBagian('Latihan terpisah dari skor', 'Latihan Bertingkat Kartu Sumber', 'Latihan ini tidak memengaruhi skor Pre/Post-test. Uji analisis PIP dan langsung periksa kartu sumbernya.', 'dokumen'),
    el('div', { style: 'display:grid;gap:12px' },
      latihanBertingkat.map((lat) => {
        const faktaUtama = baris(lat.faktaId);
        const faktaPembanding = lat.faktaPembandingId ? baris(lat.faktaPembandingId) : null;
        const jawabTersimpan = latihanState[lat.id];
        const feedbackEl = el('div', {});

        const tampilkanFeedback = (dipilih) => {
          const benar = dipilih === lat.benar;
          feedbackEl.replaceChildren(
            el('p', { class: benar ? 'benar' : 'salah' }, benar ? 'Tepat! ' : 'Belum tepat. ', el('span', { style: 'font-weight:400;color:var(--tinta-2)' }, lat.pembahasan))
          );
        };
        if (jawabTersimpan != null) tampilkanFeedback(jawabTersimpan.dipilih);

        return el('article', { class: 'kartu', id: `latihan-${lat.id}`, style: 'display:grid;gap:10px' },
          el('span', { class: 'lencana', style: 'justify-self:start' }, lat.tingkat),
          el('h3', { style: 'font-size:18px;font-weight:800' }, lat.judul),
          el('blockquote', { class: 'kutipan', style: 'margin:0' }, lat.kutipanKartu),
          el('div', { class: 'chips' },
            faktaUtama ? el('button', { type: 'button', class: 'chip', onclick: () => bukaSumber(faktaUtama) }, 'Buka Kartu Sumber Utama') : null,
            faktaPembanding ? el('button', { type: 'button', class: 'chip', onclick: () => bukaSumber(faktaPembanding) }, 'Buka Kartu Sumber Pagu Gabungan') : null,
          ),
          el('p', { style: 'font-weight:700' }, lat.pertanyaan),
          el('div', { style: 'display:grid;gap:6px' },
            lat.pilihan.map((p, idx) => el('button', {
              type: 'button',
              class: 'tombol',
              style: 'text-align:left;justify-content:flex-start',
              'aria-pressed': String(jawabTersimpan?.dipilih === idx),
              onclick: () => {
                const updated = { ...simpan.baca('transkeu.latihan', {}), [lat.id]: { dipilih: idx, benar: idx === lat.benar, waktu: new Date().toISOString() } };
                simpan.tulis('transkeu.latihan', updated);
                tampilkanFeedback(idx);
              },
            }, p)),
          ),
          feedbackEl,
        );
      })
    ),
  );

  // Bagian form Pre-test / Post-test atau pembahasan setelah Post-test
  let bagianEvaluasi;
  if (tahap === 'selesai') {
    const buatPembahasan = (judul, soalList, dataHasil) => el('div', { class: 'kartu', style: 'display:grid;gap:10px;margin-bottom:14px' },
      el('h3', { style: 'font-size:18px;font-weight:800' }, judul),
      !dataHasil.jawaban ? el('p', { class: 'catatan-kecil' }, 'Skor lama (sebelum pembaruan format) tetap dipertahankan; rincian per soal belum tersimpan.') : null,
      soalList.map((s, idx) => {
        const j = dataHasil.jawaban?.[idx];
        return el('div', { class: 'batasan' },
          el('strong', {}, `${idx + 1}. ${s.soal}`),
          j ? el('p', { class: j.benar ? 'benar' : 'salah' }, j.benar ? `Jawabanmu benar: ${s.pilihan[s.benar]}` : `Jawabanmu: ${s.pilihan[j.dipilih] ?? '-'} · Kunci: ${s.pilihan[s.benar]}`) : el('p', {}, `Kunci: ${s.pilihan[s.benar]}`),
          el('p', { class: 'catatan-kecil' }, `${KOMPETENSI_LABEL[s.kompetensi]} · ${s.alasan}`),
        );
      })
    );
    bagianEvaluasi = el('div', {},
      el('p', { class: 'benar', style: 'margin-bottom:12px' }, 'Pre-test dan Post-test selesai! Berikut pembahasan lengkap kedua set soal.'),
      buatPembahasan(`Pembahasan Post-test (Set B · ${state.sesudah.skor}/${state.sesudah.total})`, kuisSetB, state.sesudah),
      buatPembahasan(`Pembahasan Pre-test (Set A · ${state.sebelum.skor}/${state.sebelum.total})`, kuisSetA, state.sebelum),
    );
  } else {
    const form = el('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const dipilih = soalAktif.map((_, n) => form.querySelector(`input[name=s${n}]:checked`));
        if (dipilih.some((j) => !j)) return toast('Jawab semua soal dulu, ya.');
        const indeks = dipilih.map((j) => Number(j.value));
        const hasilSet = nilaiSetKuis(soalAktif, indeks);
        const nextState = { ...state, versi: VERSI_SOAL, [tahap]: hasilSet };
        simpan.tulis('transkeu.kuis', nextState);

        if (tahap === 'sebelum') {
          form.replaceWith(el('div', { class: 'kartu', style: 'display:grid;gap:10px' },
            el('p', { class: 'benar' }, `Tes Sebelum selesai! Skormu: ${hasilSet.skor}/${hasilSet.total} (${hasilSet.persen}%).`),
            el('p', {}, 'Untuk menjaga akurasi evaluasi belajar, pembahasan lengkap Tes Sebelum baru dibuka setelah kamu menyelesaikan Tes Sesudah (Set B).'),
            el('button', { type: 'button', class: 'tombol tombol-utama', onclick: tampilKuis }, 'Lanjutkan ke Latihan & Tes Sesudah'),
          ));
        } else {
          tampilKuis();
          toast(`Tes Sesudah selesai: ${hasilSet.skor}/${hasilSet.total} (${hasilSet.persen}%). Pembahasan dibuka!`);
        }
      },
    },
      soalAktif.map((s, n) => el('fieldset', {},
        el('legend', {}, `${n + 1}. ${s.soal}`),
        el('p', { class: 'catatan-kecil', style: 'margin-bottom:6px' }, KOMPETENSI_LABEL[s.kompetensi]),
        s.pilihan.map((p, i) => el('label', { class: 'pilihan' }, el('input', { type: 'radio', name: `s${n}`, value: String(i) }), el('span', {}, p))))),
      el('button', { type: 'submit', class: 'tombol tombol-utama' }, tahap === 'sebelum' ? 'Simpan Tes Sebelum' : 'Simpan & Lihat Pembahasan Lengkap'),
    );
    bagianEvaluasi = form;
  }

  $('kuis').replaceChildren(
    kepalaBagian('Kuis & evaluasi pilot', tahap === 'sebelum' ? 'Tes Sebelum Belajar (Set A)' : tahap === 'sesudah' ? 'Tes Sesudah Belajar (Set B)' : 'Hasil & Pembahasan Lengkap', null, 'kuis'),
    kartuSkor,
    bagianEvaluasi,
    wadahLatihan,
  );
}
tampilKuis();

/* ---------- Unduh umpan balik untuk tim ---------- */
$('unduh-umpan').addEventListener('click', () => {
  const isi = { umpan_balik: simpan.baca('transkeu.umpan', []), kuis: simpan.baca('transkeu.kuis', {}), latihan: simpan.baca('transkeu.latihan', {}) };
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(isi, null, 2)], { type: 'application/json' })), download: 'transkeu-umpan-balik.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('obrolan').append(sapa());
pindahTab('beranda');
aturChips(contohAwal);
perbaruiIndikatorJaringan();

function bagianInstansi() {
  const select = el('select', { 'aria-label': 'Filter jenis instansi', class: 'tombol' }, el('option', { value: 'semua' }, 'Semua K/L dalam daftar (10 terbesar)'), el('option', { value: 'kementerian' }, 'Kementerian saja (8 dari daftar)'));
  const body = el('div');
  const draw = () => {
    const rows = rankingInstansi({ jenis: select.value || 'semua' });
    body.replaceChildren(
      renderVisual({ tipe: 'batang', judul: 'Peringkat pagu awal instansi', periode: 'TA 2026 · UU APBN', satuan: 'Rp triliun', items: rows }, { el, onBukaSumber: bukaSumber }),
      renderInstansi({ rows, catatan: CATATAN_INSTANSI }, { el, onBukaSumber: bukaSumber, onTanya: tanya, onAspirasi: (items, topic) => mulaiAspirasi(items, topic) })
    );
  };
  select.addEventListener('change', draw);
  draw();
  return el('section', { class: 'bagian', id: 'belanja-instansi' }, kepalaBagian('Belanja per instansi', 'Siapa mengelola pagu terbesar?', 'Filter "Kementerian saja" menyaring daftar 10 K/L terbesar pada Lampiran I UU APBN 2026 (bukan memeringkat ulang seluruh kementerian).', 'gedung'), select, body);
}
