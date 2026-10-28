// Visualisasi interaktif data APBN untuk obrolan Transkeu.ID
// Semua visual digenerate dari baris fakta yang tervalidasi.
// Dilarang mengarang angka, koordinat liar, atau membandingkan cakupan berbeda tanpa tanda.
import { formatNilai, formatAngka, persenRealisasi } from './hitung.js';
import { ikon } from './ikon.js';

// Memvalidasi permintaan visual dari LLM atau mesin aturan
export function validasiVisual(permintaan, { fakta = [] } = {}) {
  if (!permintaan || typeof permintaan !== 'object') return null;
  const { tipe, judul, fakta_ids = [], tujuan } = permintaan;
  if (!['batang', 'komposisi', 'garis', 'kartu_angka'].includes(tipe)) return null;

  const byId = new Map(fakta.map((f) => [f.id, f]));
  const items = fakta_ids.map((id) => byId.get(id)).filter(Boolean);
  if (!items.length) return null;

  // Cek cakupan: jika ada perbedaan cakupan antar item, beri penanda
  const cakupans = new Set(items.map((i) => i.cakupan));
  const cakupanBerbeda = cakupans.size > 1 && tipe === 'batang';

  // Tentukan satuan utama
  const satuan = items[0]?.satuan ?? 'Rp triliun';
  const periode = items[0]?.posisi_data ?? `TA ${items[0]?.tahun_anggaran ?? 2026}`;

  return {
    tipe,
    judul: judul || (tipe === 'batang' ? 'Perbandingan Anggaran' : 'Komposisi APBN'),
    tujuan: tujuan || 'Visualisasi data resmi APBN',
    satuan,
    periode,
    cakupanBerbeda,
    items,
  };
}

// Menghasilkan visual bawaan cerdas berdasarkan baris fakta yang tampil dalam jawaban
export function visualOtomatis(angka, topikId) {
  if (!angka || !angka.length) return null;

  // Kasus 1: Ada 2 angka atau lebih (misal: Anggaran dan Realisasi, atau Belanja Pusat dan TKD)
  if (angka.length >= 2) {
    const anggaran = angka.find((a) => a.jenis_angka === 'Anggaran');
    const realisasi = angka.find((a) => a.jenis_angka === 'Realisasi');

    // Jika belanja pusat & TKD -> komposisi
    if (angka.some((a) => a.id.includes('bpp')) && angka.some((a) => a.id.includes('tkd'))) {
      return {
        tipe: 'komposisi',
        judul: 'Komposisi Belanja Negara 2026',
        tujuan: 'Pembagian belanja pemerintah pusat vs transfer ke daerah',
        satuan: 'Rp triliun',
        periode: 'TA 2026',
        cakupanBerbeda: false,
        items: angka,
      };
    }

    // Jika ada pasangan anggaran & realisasi
    if (anggaran && realisasi) {
      const hitungAman = persenRealisasi(realisasi, anggaran);
      const samaCakupan = Boolean(hitungAman);
      return {
        tipe: 'batang',
        judul: `Perbandingan Anggaran & Realisasi: ${anggaran.pos}`,
        tujuan: 'Melihat rencana anggaran vs realisasi yang sudah berjalan',
        satuan: anggaran.satuan,
        periode: realisasi.posisi_data || `TA ${realisasi.tahun_anggaran}`,
        cakupanBerbeda: !samaCakupan,
        items: [anggaran, realisasi],
      };
    }

    // Jika lebih dari 2 titik realisasi pada pos yang sama -> grafik garis tren
    const semuaRealisasi = angka.filter((a) => a.jenis_angka === 'Realisasi');
    if (semuaRealisasi.length >= 2) {
      return {
        tipe: 'garis',
        judul: `Tren Realisasi: ${semuaRealisasi[0].pos}`,
        tujuan: 'Melihat perkembangan realisasi antar periode',
        satuan: semuaRealisasi[0].satuan,
        periode: 'Perbandingan periode',
        cakupanBerbeda: false,
        items: semuaRealisasi,
      };
    }

    // Default 2 angka umum: grafik batang
    return {
      tipe: 'batang',
      judul: 'Perbandingan Data Fiskal',
      tujuan: 'Membandingkan data anggaran terkait',
      satuan: angka[0].satuan,
      periode: angka[0].posisi_data || `TA ${angka[0].tahun_anggaran}`,
      cakupanBerbeda: false,
      items: angka.slice(0, 4),
    };
  }

  // Kasus 2: Hanya 1 angka -> Kartu angka tunggal informatif
  const tunggal = angka[0];
  return {
    tipe: 'kartu_angka',
    judul: tunggal.pos,
    tujuan: 'Informasi nilai dan status dokumen resmi',
    satuan: tunggal.satuan,
    periode: tunggal.posisi_data || `TA ${tunggal.tahun_anggaran}`,
    cakupanBerbeda: false,
    items: [tunggal],
  };
}

// Render komponen visual interaktif utama
export function renderVisual(visual, { onBukaSumber, el } = {}) {
  if (!visual || !visual.items || !visual.items.length) return null;

  const wadah = el('div', { class: 'visual-wadah', 'data-tipe': visual.tipe });
  // Jalur Mode Dasar juga tidak boleh menggambar pasangan data yang tidak setara.
  const same = key => new Set(visual.items.map(f => f[key])).size === 1;
  const mixedKinds = !same('jenis_angka');
  const comparablePair = visual.items.length === 2 && Boolean(persenRealisasi(visual.items.find(f => f.jenis_angka === 'Realisasi'), visual.items.find(f => f.jenis_angka === 'Anggaran')));
  const allowedGroup = visual.items.every(f => f.kelompok) && same('kelompok') && same('jenis_angka');
  const sameSeries = same('cakupan') && same('jenis_angka') && new Set(visual.items.map(f => f.posisi_data ?? String(f.tahun_anggaran))).size === visual.items.length;
  const unsafe = !same('satuan') || (mixedKinds && !comparablePair) || (visual.tipe !== 'garis' && !same('tahun_anggaran') && !allowedGroup) || (visual.tipe === 'garis' && !sameSeries);
  if (unsafe) {
    wadah.append(el('h4', {}, 'Data tersedia, tetapi belum sebanding'), el('p', {}, 'Cakupan, satuan, atau periode berbeda sehingga grafik tidak digambar langsung.'));
    renderTabelData(wadah, visual, { onBukaSumber, el });
    return wadah;
  }

  // Kepala visual: judul, tujuan, dan tombol toggle tabel
  const kepala = el('div', { class: 'visual-kepala' });
  const infoJudul = el('div', { class: 'visual-info-judul' });
  infoJudul.append(
    el('h4', { class: 'visual-judul' }, visual.judul),
    el('p', { class: 'visual-tujuan' }, visual.tujuan)
  );

  const tombolTabel = el(
    'button',
    {
      type: 'button',
      class: 'tombol-visual-tab',
      'aria-expanded': 'false',
      title: 'Tampilkan format tabel data yang aksesibel',
      onclick: () => toggleTabelData(wadah, tombolTabel),
    },
    ikon('tabel'),
    el('span', {}, 'Tabel data')
  );

  kepala.append(infoJudul, tombolTabel);
  wadah.append(kepala);

  // Badge periode dan satuan
  const metaBar = el('div', { class: 'visual-meta-bar' });
  metaBar.append(
    el('span', { class: 'visual-badge' }, ikon('kalender'), el('span', {}, visual.periode)),
    el('span', { class: 'visual-badge' }, ikon('dompet'), el('span', {}, `Satuan: ${visual.satuan}`))
  );
  if (visual.cakupanBerbeda) {
    metaBar.append(
      el(
        'span',
        { class: 'visual-badge badge-peringatan', title: 'Perhatian: pos yang dibandingkan memiliki cakupan yang berbeda.' },
        ikon('peringatan'),
        el('span', {}, 'Cakupan berbeda')
      )
    );
  }
  wadah.append(metaBar);

  // Badan grafik berdasarkan tipe
  const badanGrafik = el('div', { class: 'visual-badan-grafik' });
  switch (visual.tipe) {
    case 'batang':
      renderGrafikBatang(badanGrafik, visual, { onBukaSumber, el });
      break;
    case 'komposisi':
      renderGrafikKomposisi(badanGrafik, visual, { onBukaSumber, el });
      break;
    case 'garis':
      renderGrafikGaris(badanGrafik, visual, { onBukaSumber, el });
      break;
    case 'kartu_angka':
      renderKartuAngka(badanGrafik, visual, { onBukaSumber, el });
      break;
    default:
      renderGrafikBatang(badanGrafik, visual, { onBukaSumber, el });
  }
  wadah.append(badanGrafik);

  // Badan tabel data (default: hidden)
  renderTabelData(wadah, visual, { onBukaSumber, el });

  return wadah;
}

// 1. Grafik Batang (Perbandingan Kategori / Anggaran vs Realisasi)
function renderGrafikBatang(badan, visual, { onBukaSumber, el }) {
  const maxNilai = Math.max(...visual.items.map((i) => i.nilai), 1);
  const daftar = el('div', { class: 'grafik-batang-list' });

  for (const item of visual.items) {
    const persenTinggi = Math.min(100, Math.max(8, (item.nilai / maxNilai) * 100));
    const isRealisasi = item.jenis_angka === 'Realisasi';

    const baris = el('div', { class: `baris-batang ${isRealisasi ? 'batang-realisasi' : 'batang-anggaran'}` });
    const labelWadah = el('div', { class: 'batang-label-wadah' });

    // Label: Jangan pakai kata "terpakai" untuk penerimaan; pakai "terealisasi" atau "tercapai"
    let statusLabel = item.jenis_angka;
    if (item.topik === 'pajak' && isRealisasi) {
      statusLabel = 'Tercapai';
    }

    labelWadah.append(
      el('span', { class: 'batang-nama' }, `${item.pos} (${statusLabel})`),
      el('span', { class: 'batang-nilai' }, formatNilai(item))
    );

    const rel = el('div', { class: 'batang-rel' });
    const bar = el('div', {
      class: 'batang-isi',
      style: `width: ${persenTinggi}%`,
      title: `${item.pos}: ${formatNilai(item)} (${item.dokumen})`,
    });
    rel.append(bar);

    const aksi = el('div', { class: 'batang-aksi' });
    const tombolSumber = el(
      'button',
      {
        type: 'button',
        class: 'tombol-sumber-mini',
        title: `Cek sumber resmi: ${item.dokumen}`,
        onclick: () => onBukaSumber && onBukaSumber(item),
      },
      ikon('tautan'),
      el('span', {}, 'Sumber')
    );
    aksi.append(tombolSumber);

    baris.append(labelWadah, rel, aksi);
    daftar.append(baris);
  }

  // Jika membandingkan tepat 1 Anggaran dan 1 Realisasi dengan cakupan sama, tampilkan rasio capaian
  const anggaran = visual.items.find((i) => i.jenis_angka === 'Anggaran');
  const realisasi = visual.items.find((i) => i.jenis_angka === 'Realisasi');
  const hitungAman = persenRealisasi(realisasi, anggaran);
  const samaCakupan = Boolean(hitungAman);

  if (anggaran && realisasi && samaCakupan) {
    const p = formatAngka(hitungAman.hasil, 1);
    const teksStatus = anggaran.topik === 'pajak' ? 'Tercapai' : 'Terealisasi';
    const rasioCard = el(
      'div',
      { class: 'rasio-capaian-card' },
      el('span', { class: 'rasio-label' }, `${teksStatus}:`),
      el('strong', { class: 'rasio-persen' }, `${p}%`),
      el('span', { class: 'rasio-ket' }, `dari anggaran TA ${anggaran.tahun_anggaran}`)
    );
    badan.append(daftar, rasioCard);
    return;
  }

  badan.append(daftar);
}

// 2. Grafik Komposisi (Kategori yang membentuk satu total)
function renderGrafikKomposisi(badan, visual, { onBukaSumber, el }) {
  const total = visual.items.reduce((s, i) => s + (Number(i.nilai) || 0), 0) || 1;
  const wadahKomposisi = el('div', { class: 'komposisi-wadah' });

  // Progress bar bersegmen
  const barBertumpuk = el('div', { class: 'komposisi-bar' });
  const palet = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  visual.items.forEach((item, idx) => {
    const persen = ((item.nilai / total) * 100).toFixed(1);
    const segmen = el('div', {
      class: 'komposisi-segmen',
      style: `width: ${persen}%; background: ${palet[idx % palet.length]}`,
      title: `${item.pos}: ${formatNilai(item)} (${persen}%)`,
    });
    barBertumpuk.append(segmen);
  });
  wadahKomposisi.append(barBertumpuk);

  // Legenda interaktif di bawah bar
  const legendaGrid = el('div', { class: 'komposisi-legenda' });
  visual.items.forEach((item, idx) => {
    const persen = ((item.nilai / total) * 100).toFixed(1);
    const itemLegenda = el('div', { class: 'legenda-item' });
    const titikWarna = el('span', { class: 'legenda-warna', style: `background: ${palet[idx % palet.length]}` });
    const teksLegenda = el('div', { class: 'legenda-teks' });
    teksLegenda.append(
      el('span', { class: 'legenda-nama' }, item.pos),
      el('span', { class: 'legenda-nilai' }, `${formatNilai(item)} (${persen}%)`)
    );

    const btn = el(
      'button',
      {
        type: 'button',
        class: 'legenda-sumber-btn',
        title: 'Buka sumber data',
        onclick: () => onBukaSumber && onBukaSumber(item),
      },
      ikon('tautan')
    );

    itemLegenda.append(titikWarna, teksLegenda, btn);
    legendaGrid.append(itemLegenda);
  });

  wadahKomposisi.append(legendaGrid);
  badan.append(wadahKomposisi);
}

// 3. Grafik Garis (Tren Periode Berurutan yang Sebanding)
function renderGrafikGaris(badan, visual, { onBukaSumber, el }) {
  const wadahGaris = el('div', { class: 'garis-wadah' });
  const items = [...visual.items].sort((a, b) => (a.tanggal_posisi || '').localeCompare(b.tanggal_posisi || ''));
  const maxNilai = Math.max(...items.map((i) => i.nilai), 1);
  const minNilai = Math.min(...items.map((i) => i.nilai), 0);
  const rentang = maxNilai - minNilai || 1;

  // Render visualisasi garis sederhana berbasis SVG
  const lebar = 360;
  const tinggi = 140;
  const padding = 28;
  const jarak = (lebar - padding * 2) / Math.max(items.length - 1, 1);

  const titik = items.map((item, idx) => {
    const x = padding + idx * jarak;
    const y = tinggi - padding - ((item.nilai - minNilai) / rentang) * (tinggi - padding * 2);
    return { x, y, item };
  });

  const jalurD = titik.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Bangun SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${lebar} ${tinggi}`);
  svg.setAttribute('class', 'garis-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Grafik tren ${visual.judul}`);

  // Path garis
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', jalurD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#2563eb');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  // Titik lingkaran dan label
  titik.forEach(({ x, y, item }) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('stroke', '#2563eb');
    circle.setAttribute('stroke-width', '2.5');
    svg.appendChild(circle);

    const teks = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    teks.setAttribute('x', x);
    teks.setAttribute('y', y - 8);
    teks.setAttribute('text-anchor', 'middle');
    teks.setAttribute('class', 'garis-nilai-svg');
    teks.textContent = formatNilai(item);
    svg.appendChild(teks);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', tinggi - 6);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'garis-periode-svg');
    label.textContent = (item.posisi_data || '').replace('s.d. ', '');
    svg.appendChild(label);
  });

  wadahGaris.append(svg);

  // Daftar poin interaktif di bawahnya
  const poinList = el('div', { class: 'garis-poin-list' });
  items.forEach((item) => {
    const btn = el(
      'button',
      {
        type: 'button',
        class: 'chip-poin-garis',
        onclick: () => onBukaSumber && onBukaSumber(item),
      },
      el('span', {}, `${item.posisi_data || item.tahun_anggaran}: `),
      el('strong', {}, formatNilai(item)),
      ikon('tautan')
    );
    poinList.append(btn);
  });
  wadahGaris.append(poinList);

  badan.append(wadahGaris);
}

// 4. Kartu Angka Tunggal (Untuk Jawaban 1 Fakta Utama)
function renderKartuAngka(badan, visual, { onBukaSumber, el }) {
  const item = visual.items[0];
  const kartu = el('div', { class: 'kartu-angka-tunggal' });

  const labelWadah = el('div', { class: 'angka-label-wadah' });
  labelWadah.append(
    el('span', { class: 'angka-pos' }, item.pos),
    el('span', { class: 'angka-jenis-tag' }, item.jenis_angka)
  );

  const nilaiBesar = el('div', { class: 'angka-nilai-besar' }, formatNilai(item));

  const infoBawah = el('div', { class: 'angka-info-bawah' });
  infoBawah.append(
    el('span', { class: 'angka-periode' }, ikon('kalender'), el('span', {}, item.posisi_data || `TA ${item.tahun_anggaran}`)),
    el(
      'button',
      {
        type: 'button',
        class: 'tombol-sumber-kartu',
        onclick: () => onBukaSumber && onBukaSumber(item),
      },
      ikon('tautan'),
      el('span', {}, 'Lihat Dokumen Resmi')
    )
  );

  kartu.append(labelWadah, nilaiBesar, infoBawah);
  badan.append(kartu);
}

// 5. Tabel Data Aksesibel (Alternatif Grafik)
function renderTabelData(wadah, visual, { onBukaSumber, el }) {
  const tabelWadah = el('div', { class: 'visual-badan-tabel', hidden: true });
  const tabel = el('table', { class: 'tabel-visual' });

  const thead = el('thead');
  thead.append(
    el(
      'tr',
      {},
      el('th', { scope: 'col' }, 'Pos Anggaran'),
      el('th', { scope: 'col' }, 'Jenis'),
      el('th', { scope: 'col' }, 'Periode'),
      el('th', { scope: 'col' }, 'Nilai'),
      el('th', { scope: 'col' }, 'Sumber')
    )
  );

  const tbody = el('tbody');
  for (const item of visual.items) {
    const tr = el('tr');
    tr.append(
      el('td', {}, item.pos),
      el('td', {}, item.jenis_angka),
      el('td', {}, item.posisi_data || `TA ${item.tahun_anggaran}`),
      el('td', { class: 'tabel-kolom-angka' }, formatNilai(item)),
      el(
        'td',
        {},
        el(
          'button',
          {
            type: 'button',
            class: 'tombol-tabel-sumber',
            title: `Buka ${item.dokumen}`,
            onclick: () => onBukaSumber && onBukaSumber(item),
          },
          'Lihat PDF'
        )
      )
    );
    tbody.append(tr);
  }

  tabel.append(thead, tbody);
  tabelWadah.append(tabel);
  wadah.append(tabelWadah);
}

// Helper toggle tampilan grafik vs tabel data
function toggleTabelData(wadah, tombol) {
  const badanGrafik = wadah.querySelector('.visual-badan-grafik');
  const badanTabel = wadah.querySelector('.visual-badan-tabel');
  const teksTombol = tombol.querySelector('span');

  const sedangBukaTabel = !badanTabel.hidden;
  badanTabel.hidden = sedangBukaTabel;
  badanGrafik.hidden = !sedangBukaTabel;

  tombol.setAttribute('aria-expanded', String(!sedangBukaTabel));
  teksTombol.textContent = sedangBukaTabel ? 'Tabel data' : 'Tampilkan grafik';
}
