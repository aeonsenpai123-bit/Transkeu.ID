import { fakta, kegunaan } from '../data/fakta.js';
import { topik, contohAwal } from '../data/topik.js';
import { istilah } from '../data/istilah.js';
import { kuis } from '../data/kuis.js';
import { jejakAnggaran } from '../data/jejak.js';
import { kanalResmi, susunDrafAspirasi } from '../data/aspirasi.js';
import { jawab, PESAN_TIDAK_TERSEDIA } from './mesin.js';
import { formatNilai, persenRealisasi } from './hitung.js';
import { ikon } from './ikon.js';
import { renderVisual } from './visual.js';

const data = { fakta, kegunaan, topik, istilah };
const $ = (id) => document.getElementById(id);
const baris = (id) => fakta.find((f) => f.id === id);
const IKON_TOPIK = { pendidikan: 'sekolah', kesehatan: 'hati', perlinsos: 'tangan', infrastruktur: 'jalan', subsidi_energi: 'api', pajak: 'koin' };
for (const e of document.querySelectorAll('[data-ikon]')) e.prepend(ikon(e.dataset.ikon));

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
  t.textContent = pesan;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 3500);
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
      el('dt', {}, 'Halaman'), el('dd', {}, b.halaman_atau_tabel ?? 'Halaman web (tanpa nomor halaman)'),
      el('dt', {}, 'Pemeriksaan'), el('dd', {}, diperiksa ? `Dicek ${b.diperiksa_oleh.join(' dan ')}, ${b.tanggal_periksa}` : 'Belum dicek dua orang tim'),
    ),
    el('div', { class: 'judul-kecil' }, 'Kutipan asli'),
    el('blockquote', { class: 'kutipan' }, b.kutipan),
    b.catatan ? el('p', { class: 'catatan-kecil', style: 'margin-bottom:16px' }, `Catatan: ${b.catatan}`) : null,
    el('a', { class: 'tombol tombol-utama', href: b.url, target: '_blank', rel: 'noopener noreferrer', style: 'width:100%' }, ikon('keluar'), 'Buka dokumen asli (tab baru)'),
  );
}

function bukaIstilah(i) {
  bukaSheet(i.istilah, 'kamus', el('p', { class: 'ringkas', style: 'margin-top:14px' }, i.arti), el('p', { class: 'catatan-kecil', style: 'margin-top:12px' }, 'Penjelasan umum dari Kamus Transkeu.ID.'));
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
    el('span', { class: 'v' }, formatNilai(b)), el('span', { class: 'ikon-sumber', 'aria-hidden': 'true' }, ikon('dokumen'), 'sumber'));
}

function barisAngka(b, sudah) {
  return el('li', { class: `jenis-${b.jenis_angka}` },
    el('span', { class: 'label-jenis' }, labelJenis(b)),
    el('span', { class: 'pos' }, teksBeristilah(b.pos, sudah)),
    tombolNilai(b),
    b.diperiksa_oleh?.length >= 2 ? null : el('span', { class: 'belum-diperiksa' }, 'Belum dicek dua orang tim'),
  );
}

/* ---------- Umpan balik ---------- */
function umpanBalik(pertanyaan, hasil) {
  const wadah = el('div', {});
  const catat = (jenis, extra = {}) => {
    const daftar = simpan.baca('transkeu.umpan', []);
    daftar.push({ jenis, pertanyaan, mode: hasil.ai ? 'ai' : 'dasar', waktu: new Date().toISOString(), ...extra });
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
function kepalaJawaban(hasil) {
  return el('div', { class: 'jawaban-kepala' },
    el('span', { class: 'avatar', 'aria-hidden': 'true' }, ikon('kilau')),
    el('strong', {}, 'Transkeu'),
    hasil.ai
      ? el('span', { class: 'mode', title: 'AI menjelaskan; semua angka diisi program dari tabel fakta' }, 'AI · angka dari tabel fakta')
      : el('span', { class: 'mode dasar', title: hasil.catatan_mode || 'AI sedang tidak aktif; jawaban disusun aturan sistem' }, 'Mode dasar'));
}

function chipsLanjutan(daftar) {
  if (!daftar?.length) return null;
  return el('div', {}, el('div', { class: 'judul-kecil' }, ikon('tanya'), 'Tanya lanjut'),
    el('div', { class: 'chips' }, daftar.map((q) => el('button', { type: 'button', class: 'chip', onclick: () => tanya(q) }, q))));
}

function kartuJawaban(pertanyaan, hasil) {
  const sudah = new Set();
  if (hasil.status === 'istilah') {
    return el('article', { class: 'kartu jawaban' }, kepalaJawaban(hasil),
      el('p', { class: 'ringkas' }, el('strong', {}, hasil.istilah.istilah), `: ${hasil.istilah.arti}`),
      chipsLanjutan(hasil.lanjutan),
      umpanBalik(pertanyaan, hasil));
  }
  if (hasil.status === 'tidak_tersedia') {
    return el('article', { class: 'kartu jawaban tidak-tersedia' }, kepalaJawaban(hasil),
      el('p', { class: 'ringkas' }, ikon('peringatan'), el('span', {}, hasil.pesan ?? PESAN_TIDAK_TERSEDIA)),
      hasil.alasan ? el('p', {}, hasil.alasan) : null,
      el('a', { class: 'tombol', href: hasil.portal.url, target: '_blank', rel: 'noopener noreferrer' }, ikon('keluar'), `Buka ${hasil.portal.nama}`),
      chipsLanjutan(hasil.lanjutan),
      umpanBalik(pertanyaan, hasil));
  }

  return el('article', { class: 'kartu jawaban' },
    kepalaJawaban(hasil),
    el('p', { class: 'ringkas' }, teksBeristilah(hasil.ringkas, sudah)),
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
        el('button', { type: 'button', class: 'istilah-tag', onclick: () => bukaSumber({ ...k, pos: k.teks, nilai: null }) }, '(sumber)'))))),
    hasil.istilah?.length > 0 && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('kamus'), 'Istilah di jawaban ini'),
      el('div', { class: 'chips' }, hasil.istilah.map((i) => el('button', { type: 'button', class: 'chip', onclick: () => bukaIstilah(i) }, i.istilah)))),
    hasil.angka.length > 0 && el('div', {},
      el('div', { class: 'judul-kecil' }, ikon('dokumen'), 'Sumber'),
      el('ul', { class: 'sumber-list' }, hasil.angka.map((b, n) => el('li', {},
        el('button', { type: 'button', class: 'tombol-sumber', onclick: () => bukaSumber(b) },
          el('span', { class: 'no' }, `[${n + 1}]`), el('span', { class: 'teks' }, `${labelJenis(b)}: ${judulSumber(b)}`), ikon('panah')))))),
    hasil.batasan?.length > 0 && el('div', { class: 'batasan' }, el('div', { class: 'judul-kecil', style: 'margin:0' }, ikon('info'), 'Batasan'), hasil.batasan.map((t) => el('p', {}, t))),
    chipsLanjutan(hasil.lanjutan),
    umpanBalik(pertanyaan, hasil),
  );
}

/* ---------- Tanya (AI di server, mesin aturan sebagai cadangan) ---------- */
const riwayatAI = [];
let sedangMenjawab = false;

async function tanyaServer(pertanyaan) {
  try {
    const r = await fetch('/api/tanya', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pertanyaan, riwayat: riwayatAI.slice(-3) }),
      signal: AbortSignal.timeout(45000),
    });
    if (r.status === 429) toast('Batas pertanyaan AI hari ini habis. Jawaban memakai mode dasar.');
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

function aturChips(daftar) {
  $('chips').replaceChildren(...daftar.map((q) => el('button', { type: 'button', class: 'chip', onclick: () => tanya(q) }, q)));
}

async function tanya(pertanyaan) {
  const q = pertanyaan.trim();
  if (!q || sedangMenjawab) return;
  sedangMenjawab = true;
  pindahTab('tanya');
  $('sapa')?.remove();
  const gelembung = el('p', { class: 'gelembung' }, q);
  const memuat = el('div', { class: 'kartu jawaban memuat', role: 'status' }, el('span', { class: 'titik-titik', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')), 'Transkeu sedang membaca dokumen…');
  $('obrolan').append(gelembung, memuat);
  gelembung.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const hasil = (await tanyaServer(q)) ?? jawab(q, data);
  const kartu = kartuJawaban(q, hasil);
  memuat.replaceWith(kartu);
  if (hasil.status === 'ok') riwayatAI.push({ tanya: q, jawab: hasil.ringkas });
  aturChips(hasil.lanjutan?.length ? hasil.lanjutan : contohAwal);
  simpan.tulis('transkeu.riwayat', [...new Set([q, ...simpan.baca('transkeu.riwayat', [])])].slice(0, 8));
  sedangMenjawab = false;
}

function sapa() {
  const terakhir = simpan.baca('transkeu.riwayat', []);
  return el('div', { class: 'sapa', id: 'sapa' },
    el('img', { class: 'avatar-besar logo-avatar', src: 'assets/logo.jpg', alt: 'Logo Transkeu.ID' }),
    el('h2', {}, 'Halo, aku Transkeu'),
    el('p', {}, 'Aku membantu menjelaskan ke mana uang rakyat di APBN dipakai. Tanyakan dengan bahasa sehari-hari; setiap angka bisa kamu cek sumbernya.'),
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
      // Lebar batang = proporsi nilai, hanya visual; angka yang tertulis tetap nilai dari tabel fakta.
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
  const semua = fakta.filter((f) => f.topik === t.id);
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
$('isi-beranda').append(
  bagianArus(),
  bagianPembagian(),
  el('div', { class: 'bagian' },
    kepalaBagian('Topik populer', 'Enam topik yang paling sering ditanya', 'Anggaran, yang sudah terpakai, dan cara membacanya.', 'topik'),
    el('div', { class: 'grid-topik' }, topik.filter((t) => !t.tersembunyi).map(kartuTopik))),
  el('div', { class: 'bagian' },
    el('div', { class: 'kartu', style: 'display:grid;gap:12px' },
      el('h3', { style: 'font-size:20px;font-weight:800' }, 'Fitur Partisipasi & Pengawasan'),
      el('p', { class: 'catatan-kecil' }, 'Pantau aliran program dari pagu hingga output fisik di Jejak Anggaran, atau susun draf advokasi publik berbasis data resmi APBN.'),
      el('div', { class: 'chips' },
        el('button', { type: 'button', class: 'tombol tombol-utama', onclick: () => { pindahTab('jejak'); window.scrollTo(0, 0); } }, ikon('jejak'), 'Jejak Anggaran'),
        el('button', { type: 'button', class: 'tombol', onclick: () => { pindahTab('aspirasi'); window.scrollTo(0, 0); } }, ikon('aspirasi'), 'Aspirasi Data')))),
  el('div', { class: 'bagian' },
    el('div', { class: 'kartu', style: 'display:grid;gap:12px' },
      el('h3', { style: 'font-size:20px;font-weight:800' }, 'Seberapa paham kamu soal APBN?'),
      el('p', { class: 'catatan-kecil' }, 'Kerjakan kuis lima soal sebelum dan sesudah memakai Transkeu.ID, lalu lihat perubahannya.'),
      el('div', { class: 'chips' },
        el('button', { type: 'button', class: 'tombol tombol-utama', onclick: () => { pindahTab('kuis'); window.scrollTo(0, 0); } }, ikon('kuis'), 'Mulai kuis'),
        el('button', { type: 'button', class: 'tombol', onclick: () => { pindahTab('kamus'); window.scrollTo(0, 0); } }, ikon('kamus'), 'Buka kamus')))),
);

/* ---------- Jejak Anggaran (Paper: Alokasi -> Realisasi -> Capaian) ---------- */
function renderJejakStep(judul, dataStep, kelasBadge, statusCapaian = 'tersedia') {
  if (!dataStep) return null;
  const isCapaian = kelasBadge === 'capaian';
  const isBelum = statusCapaian === 'belum_tersedia' || dataStep.status === 'belum_tersedia';

  return el('div', { class: 'jejak-step-card' },
    el('div', { class: 'step-header' },
      el('span', { class: 'step-nomor' }, judul),
      el('span', { class: `step-badge step-badge-${isBelum ? 'belum' : kelasBadge}` },
        isBelum ? 'Belum Rilis' : (isCapaian ? 'Output Fisik' : (dataStep.satuan ?? ''))),
    ),
    el('div', { class: 'step-nilai' },
      isCapaian
        ? (isBelum ? 'Belum dipublikasikan' : dataStep.output_fisik)
        : (dataStep.nilai != null ? formatNilai(dataStep) : 'Belum dirinci'),
    ),
    el('div', { class: 'step-label' }, dataStep.label),
    dataStep.dokumen && dataStep.url
      ? el('button', {
          type: 'button',
          class: 'step-tombol-sumber',
          onclick: () => bukaSumber({
            ...dataStep,
            pos: dataStep.label,
            jenis_angka: isCapaian ? 'Capaian Output' : (kelasBadge === 'alokasi' ? 'Anggaran' : 'Realisasi'),
            tahun_anggaran: 2026,
            diperiksa_oleh: ['Ridho Rambu Bassae', 'Nisaa'],
            tanggal_periksa: '22 Oktober 2026',
          }),
        }, ikon('dokumen'), 'Lihat dokumen sumber')
      : null,
  );
}

function kartuJejak(item) {
  const alokasi = item.tahap.alokasi;
  const realisasi = item.tahap.realisasi;
  const capaian = item.tahap.capaian;

  return el('article', { class: 'jejak-kartu' },
    el('div', { class: 'jejak-header' },
      el('div', { class: 'jejak-judul-blok' },
        el('span', { class: 'jejak-sektor-badge' }, item.sektor),
        el('h3', {}, item.nama),
        el('p', { class: 'jejak-deskripsi' }, item.deskripsi),
      ),
      el('button', {
        type: 'button',
        class: 'tombol-teks',
        onclick: () => tanya(`Bagaimana alokasi dan realisasi ${item.nama.toLowerCase()}?`),
      }, 'Tanya AI', ikon('panah')),
    ),
    el('div', { class: 'jejak-alur' },
      renderJejakStep('1. Alokasi Pagu', alokasi, 'alokasi'),
      renderJejakStep('2. Realisasi Belanja', realisasi, 'realisasi'),
      renderJejakStep('3. Capaian Fisik', capaian, 'capaian', capaian.status),
    ),
    el('p', { class: 'jejak-catatan-kaki' },
      ikon('info'),
      el('strong', {}, ' Catatan Pengawasan: '),
      item.catatan_pengawasan,
    ),
  );
}

let filterJejakAktif = 'semua';
function tampilJejak(filter = 'semua') {
  filterJejakAktif = filter;
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
      onclick: () => tampilJejak(f.id),
    }, f.nama)),
  );

  const daftarItem = jejakAnggaran.filter((j) => filterJejakAktif === 'semua' || j.topik === filterJejakAktif);

  const wadahKartu = el('div', { class: 'jejak-list' },
    daftarItem.map(kartuJejak),
  );

  const disclaimerBox = el('div', { class: 'disclaimer-jejak' },
    ikon('peringatan'),
    el('strong', {}, ' Prinsip Akuntansi Sektor Publik: '),
    'Realisasi belanja mencerminkan penyerapan kas negara, ',
    el('strong', {}, 'bukan ukuran otomatis keberhasilan atau dampak program. '),
    'Transkeu.ID menyandingkan pagu anggaran, realisasi berjalan, dan output fisik riil agar warga dapat mengawasi kemanfaatan setiap rupiah uang pajak.',
  );

  $('jejak-anggaran').replaceChildren(
    kepalaBagian('Jejak Anggaran', 'Telusuri Dari Pagu Hingga Capaian Nyata', 'Menghubungkan tiga mata rantai: Berapa yang dianggarkan, berapa yang dibelanjakan, dan apa hasil fisik yang dinikmati masyarakat.', 'jejak'),
    disclaimerBox,
    filterBar,
    wadahKartu,
  );
}
tampilJejak();

/* ---------- Aspirasi Berbasis Data (Paper: Warga Mengawasi APBN) ---------- */
function tampilAspirasi() {
  const topikList = [
    'Pendidikan (Sekolah, Beasiswa, Fasilitas Belajar)',
    'Kesehatan (BPJS PBI, Layanan RS, Skrining Kesehatan)',
    'Perlindungan Sosial (PKH, Sembako, Bantuan Tunai)',
    'Infrastruktur (Jalan Rusak, Irigasi, Jembatan, Transportasi)',
    'Subsidi Energi (Ketersediaan Gas LPG 3kg, Listrik, BBM)',
    'Penerimaan Pajak & Tata Kelola Keuangan Negara',
    'Kebijakan APBN Umum & Anggaran Prioritas',
  ];

  const selectTopik = el('select', { id: 'asp-topik' },
    topikList.map((t) => el('option', { value: t }, t)),
  );

  const inputLokasi = el('input', {
    type: 'text',
    id: 'asp-lokasi',
    placeholder: 'Contoh: Kabupaten Lebak, Banten',
    maxlength: '100',
  });

  const textMasalah = el('textarea', {
    id: 'asp-masalah',
    placeholder: 'Jelaskan kendala nyata di lapangan (misal: "Banyak siswa prasejahtera di desa kami belum menerima bantuan PIP padahal terdaftar di DTKS...")',
    rows: '3',
    maxlength: '600',
    required: true,
  });

  const textData = el('textarea', {
    id: 'asp-data',
    placeholder: 'Sebutkan angka atau dokumen resmi dari Transkeu.ID (misal: "APBN 2026 mengalokasikan PIP Rp11,2 T untuk 16 juta siswa menurut Konpers APBN KiTa Oktober 2026")',
    rows: '2',
    maxlength: '400',
  });

  const textMasukan = el('textarea', {
    id: 'asp-masukan',
    placeholder: 'Apa usulan atau solusi konkret Anda? (misal: "Memohon dinas terkait mempercepat verifikasi data dan membuka posko pengaduan di sekolah...")',
    rows: '3',
    maxlength: '600',
    required: true,
  });

  const wadahDraf = el('div', { class: 'draf-hasil-wadah', hidden: true });
  const previewDraf = el('div', { class: 'draf-preview' });

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

  const tombolTutupDraf = el('button', {
    type: 'button',
    class: 'tombol',
    onclick: () => { wadahDraf.hidden = true; },
  }, 'Tutup Draf');

  wadahDraf.append(
    el('div', { class: 'judul-kecil' }, ikon('dokumen'), 'Draf Surat Aspirasi Siap Kirim'),
    previewDraf,
    el('div', { class: 'draf-tombol-bar' }, tombolSalin, tombolTutupDraf),
  );

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
        masukan: textMasukan.value,
        lokasi: inputLokasi.value,
      });
      previewDraf.textContent = draf;
      wadahDraf.hidden = false;
      wadahDraf.scrollIntoView({ behavior: 'smooth' });
      toast('Draf aspirasi berhasil disusun!');
    },
  },
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-topik' }, '1. Pilih Topik Pelayanan Publik'), selectTopik),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-lokasi' }, '2. Wilayah / Lokasi (Opsional)'), inputLokasi),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-masalah' }, '3. Masalah atau Kendala Nyata'), textMasalah),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-data' }, '4. Data Rujukan APBN (Berdasarkan Temuan di Transkeu.ID)'), textData),
    el('div', { class: 'grup-input' }, el('label', { for: 'asp-masukan' }, '5. Usulan / Rekomendasi Solusi Konstruktif'), textMasukan),
    el('button', { type: 'submit', class: 'tombol tombol-utama' }, ikon('kirim'), 'Susun Draf Aspirasi Berbasis Data'),
  );

  const daftarKanal = el('div', { class: 'kanal-aspirasi-wadah' },
    kepalaBagian('Kanal Resmi Pemerintah', 'Kirimkan Aspirasi Anda ke Lembaga Berwenang', 'Transkeu.ID tidak mengirim data aspirasi secara otomatis. Salin draf Anda dan sampaikan langsung melalui saluran pengaduan resmi nasional yang terverifikasi berikut:', 'keluar'),
    el('div', { class: 'kanal-grid' },
      kanalResmi.map((k) => el('a', {
        href: k.url,
        class: 'kanal-card',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
        el('h4', {}, k.nama, ikon('keluar')),
        el('p', { class: 'instansi' }, k.instansi),
        el('p', { class: 'fungsi' }, k.kegunaan),
      )),
    ),
  );

  $('aspirasi-data').replaceChildren(
    kepalaBagian('Aspirasi Berbasis Data', 'Ubah Suara Warga Jadi Masukan Berbobot', 'Gunakan data anggaran resmi untuk menyusun kritik dan masukan yang kredibel, santun, dan dapat dipertanggungjawabkan kepada instansi terkait.', 'aspirasi'),
    el('div', { class: 'aspirasi-intro kartu' },
      el('p', {}, 'Kritik publik sering kali diabaikan karena dianggap sekadar keluhan tanpa dasar. Transkeu.ID memfasilitasi Anda menghubungkan persoalan nyata di lapangan dengan angka alokasi resmi negara, sehingga masukan Anda memiliki bobot advokasi yang kuat.'),
    ),
    form,
    wadahDraf,
    daftarKanal,
  );
}
tampilAspirasi();

/* ---------- Kamus ---------- */
function tampilKamus(filter = '') {
  const f = filter.toLowerCase().trim();
  const cocok = istilah.filter((i) => !f || [i.istilah, ...(i.alias ?? []), i.arti].some((s) => s.toLowerCase().includes(f)));
  $('daftar-istilah').replaceChildren(...(cocok.length
    ? cocok.map((i) => el('div', {},
        el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px' },
          el('dt', {}, i.istilah, i.alias ? ` (${i.alias.join(', ')})` : ''),
          el('button', { type: 'button', class: 'tombol-teks', style: 'font-size:13px;white-space:nowrap;min-height:36px', onclick: () => tanya(`Apa itu ${i.istilah}?`) }, 'Tanyakan', ikon('panah'))),
        el('dd', {}, i.arti)))
    : [el('p', { class: 'catatan-kecil' }, 'Istilah tidak ditemukan.')]));
}
$('cari-istilah').addEventListener('input', (e) => tampilKamus(e.target.value));
tampilKamus();

/* ---------- Kuis ---------- */
function tampilKuis() {
  const skor = simpan.baca('transkeu.kuis', {});
  const tahap = skor.sebelum ? 'sesudah' : 'sebelum';
  const selesai = skor.sebelum && skor.sesudah;
  const ringkasan = el('div', { class: 'kartu', style: 'margin-bottom:16px' },
    el('p', {}, 'Kerjakan lima soal sebelum memakai Transkeu.ID, lalu kerjakan lagi sesudahnya. Skor hanya disimpan di perangkat ini, tanpa nama.'),
    el('div', { class: 'skor' },
      el('div', {}, 'Tes sebelum', el('strong', {}, skor.sebelum ? `${skor.sebelum.skor}/${kuis.length}` : '–')),
      el('div', {}, 'Tes sesudah', el('strong', {}, skor.sesudah ? `${skor.sesudah.skor}/${kuis.length}` : '–'))),
    selesai ? el('p', { class: 'benar' }, `Perubahan: ${skor.sesudah.skor - skor.sebelum.skor >= 0 ? '+' : ''}${skor.sesudah.skor - skor.sebelum.skor} soal`) : null,
    skor.sebelum ? el('button', { type: 'button', class: 'tombol', style: 'margin-top:12px', onclick: () => { simpan.tulis('transkeu.kuis', {}); tampilKuis(); } }, 'Ulang dari awal') : null,
  );
  const form = el('form', { onsubmit: (e) => {
    e.preventDefault();
    const jawaban = kuis.map((_, n) => form.querySelector(`input[name=s${n}]:checked`));
    if (jawaban.some((j) => !j)) return toast('Jawab semua soal dulu, ya.');
    const benar = jawaban.filter((j, n) => Number(j.value) === kuis[n].benar).length;
    form.querySelectorAll('input[type=radio]').forEach((r) => { r.disabled = true; });
    simpan.tulis('transkeu.kuis', { ...skor, [tahap]: { skor: benar, waktu: new Date().toISOString() } });
    kuis.forEach((s, n) => {
      const ok = Number(jawaban[n].value) === s.benar;
      form.querySelectorAll('fieldset')[n].append(el('p', { class: ok ? 'benar' : 'salah' }, ok ? 'Benar. ' : `Kurang tepat. Jawaban: ${s.pilihan[s.benar]}. `, el('span', { style: 'font-weight:400;color:var(--tinta-2)' }, s.alasan)));
    });
    form.querySelector('button[type=submit]').replaceWith(el('button', { type: 'button', class: 'tombol tombol-utama', onclick: tampilKuis }, `Skor ${benar} dari ${kuis.length}. Selesai`));
  } },
    kuis.map((s, n) => el('fieldset', {},
      el('legend', {}, `${n + 1}. ${s.soal}`),
      s.pilihan.map((p, i) => el('label', { class: 'pilihan' }, el('input', { type: 'radio', name: `s${n}`, value: String(i) }), el('span', {}, p))))),
    el('button', { type: 'submit', class: 'tombol tombol-utama' }, 'Lihat skor'),
  );
  $('kuis').replaceChildren(
    kepalaBagian('Kuis pemahaman', tahap === 'sebelum' ? 'Tes sebelum belajar' : 'Tes sesudah belajar', null, 'kuis'),
    ringkasan, selesai ? el('p', {}, 'Kedua tes sudah selesai. Terima kasih!') : form);
}
tampilKuis();

/* ---------- Unduh umpan balik untuk tim ---------- */
$('unduh-umpan').addEventListener('click', () => {
  const isi = { umpan_balik: simpan.baca('transkeu.umpan', []), kuis: simpan.baca('transkeu.kuis', {}) };
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(isi, null, 2)], { type: 'application/json' })), download: 'transkeu-umpan-balik.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('obrolan').append(sapa());
pindahTab('beranda');
aturChips(contohAwal);
