// Visualisasi interaktif data APBN untuk obrolan Transkeu.ID
// Semua visual digenerate dari baris fakta yang tervalidasi.
// Dilarang mengarang angka, koordinat liar, atau membandingkan cakupan berbeda tanpa tanda.
import { formatNilai, formatAngka } from './hitung.js';
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
        periode: 'APBN TA 2026',
        cakupanBerbeda: false,
        items: angka,
      };
    }

    // Jika ada pasangan anggaran & realisasi
    if (anggaran && realisasi) {
      return {
        tipe: 'batang',
        judul: `Perbandingan Anggaran & Realisasi: ${anggaran.pos}`,
        tujuan: 'Melihat rencana anggaran vs realisasi yang sudah berjalan',
        satuan: anggaran.satuan,
        periode: realisasi.posisi_data ?? `TA ${anggaran.tahun_anggaran}`,
        cakupanBerbeda: anggaran.cakupan !== realisasi.cakupan,
        items: [anggaran, realisasi],
      };
    }

    // Jika banyak fungsi atau pos
    return {
      tipe: 'batang',
      judul: 'Ringkasan Angka Terkait',
      tujuan: 'Perbandingan pos-pos anggaran',
      satuan: angka[0].satuan,
      periode: `TA ${angka[0].tahun_anggaran}`,
      cakupanBerbeda: cakupansGanda(angka),
      items: angka,
    };
  }

  // Kasus 2: Hanya satu angka
  if (angka.length === 1) {
    const item = angka[0];
    return {
      tipe: 'kartu_angka',
      judul: item.pos,
      tujuan: `${item.jenis_angka} ${item.posisi_data ?? `TA ${item.tahun_anggaran}`}`,
      satuan: item.satuan,
      periode: item.posisi_data ?? `TA ${item.tahun_anggaran}`,
      cakupanBerbeda: false,
      items: [item],
    };
  }

  return null;
}

function cakupansGanda(daftar) {
  return new Set(daftar.map((d) => d.cakupan)).size > 1;
}

// Render visual interaktif ke elemen DOM
export function renderVisual(visual, { onBukaSumber, el }) {
  if (!visual || !visual.items?.length) return null;

  const wadah = el('div', { class: 'kartu-visual' });
  let modeTabel = false;

  // Header visual
  const tombolToggle = el('button', {
    type: 'button',
    class: 'tombol-visual-tab',
    title: 'Ganti tampilan grafik / tabel data',
    onclick: () => {
      modeTabel = !modeTabel;
      badanGrafik.hidden = modeTabel;
      badanTabel.hidden = !modeTabel;
      tombolToggle.textContent = modeTabel ? 'Tampilkan grafik' : 'Tampilkan tabel data';
    },
  }, 'Tampilkan tabel data');

  const kepala = el('div', { class: 'visual-kepala' },
    el('div', { class: 'visual-judul-blok' },
      el('span', { class: 'lencana-visual' }, ikon('topik'), visual.tipe.toUpperCase()),
      el('h4', { class: 'visual-judul' }, visual.judul),
      el('p', { class: 'visual-tujuan' }, visual.tujuan),
    ),
    tombolToggle,
  );

  const metaBar = el('div', { class: 'visual-meta' },
    el('span', { class: 'visual-pill' }, ikon('gedung'), visual.periode),
    el('span', { class: 'visual-pill' }, ikon('koin'), visual.satuan),
    visual.cakupanBerbeda ? el('span', { class: 'visual-pill peringatan-pill' }, ikon('peringatan'), 'Cakupan berbeda') : null,
  );

  // Badan Grafik
  const badanGrafik = el('div', { class: 'visual-badan-grafik' });
  renderTipeGrafik(badanGrafik, visual, { onBukaSumber, el });

  // Badan Tabel Data (Aksesibilitas & audit data)
  const badanTabel = el('div', { class: 'visual-badan-tabel', hidden: true });
  renderTabelData(badanTabel, visual, { onBukaSumber, el });

  wadah.append(kepala, metaBar, badanGrafik, badanTabel);
  return wadah;
}

function renderTipeGrafik(wadah, visual, { onBukaSumber, el }) {
  const { tipe, items, cakupanBerbeda } = visual;

  if (tipe === 'batang') {
    renderGrafikBatang(wadah, items, cakupanBerbeda, { onBukaSumber, el });
  } else if (tipe === 'komposisi') {
    renderGrafikKomposisi(wadah, items, { onBukaSumber, el });
  } else if (tipe === 'garis') {
    renderGrafikGaris(wadah, items, { onBukaSumber, el });
  } else {
    renderKartuAngka(wadah, items[0], { onBukaSumber, el });
  }
}

// Grafik Batang Interaktif
function renderGrafikBatang(wadah, items, cakupanBerbeda, { onBukaSumber, el }) {
  const maxNilai = Math.max(...items.map((i) => i.nilai), 1);
  const daftar = el('div', { class: 'grafik-batang-list' });

  // Cari apakah ada pasangan Anggaran & Realisasi bercakupan sama
  const anggaran = items.find((i) => i.jenis_angka === 'Anggaran');
  const realisasi = items.find((i) => i.jenis_angka === 'Realisasi');
  const samaCakupan = anggaran && realisasi && anggaran.cakupan === realisasi.cakupan;

  for (const item of items) {
    const persenPenuh = Math.min(Math.round((item.nilai / maxNilai) * 100), 100);
    const kelasWarna = `bar-warna-${item.jenis_angka.toLowerCase()}`;

    // Label realisasi: 'tercapai' untuk pajak, 'terpakai' untuk belanja
    let labelPersen = '';
    if (samaCakupan && item.jenis_angka === 'Realisasi') {
      const p = ((realisasi.nilai / anggaran.nilai) * 100).toFixed(1).replace('.', ',');
      const kataLabel = item.cakupan === 'pajak' || item.pos.toLowerCase().includes('penerimaan') ? 'tercapai' : 'terpakai';
      labelPersen = `${p}% ${kataLabel}`;
    }

    const barItem = el('div', { class: 'bar-row' },
      el('div', { class: 'bar-info' },
        el('div', { class: 'bar-label-group' },
          el('span', { class: `bar-tag tag-${item.jenis_angka.toLowerCase()}` }, item.jenis_angka),
          el('span', { class: 'bar-pos-nama' }, item.pos),
          item.posisi_data ? el('span', { class: 'bar-posisi' }, item.posisi_data) : null,
        ),
        el('button', {
          type: 'button',
          class: 'bar-nilai-btn',
          title: 'Klik untuk melihat dokumen sumber',
          onclick: () => onBukaSumber(item),
        },
          el('strong', {}, formatNilai(item)),
          el('span', { class: 'bar-sumber-ikon' }, ikon('dokumen')),
        ),
      ),
      el('div', { class: 'bar-track' },
        el('div', {
          class: `bar-fill ${kelasWarna}`,
          style: `width: ${persenPenuh}%`,
          role: 'progressbar',
          'aria-valuenow': item.nilai,
          'aria-valuemin': 0,
          'aria-valuemax': maxNilai,
          'aria-label': `${item.pos}: ${formatNilai(item)}`,
        }),
      ),
      labelPersen ? el('div', { class: 'bar-persen-keterangan' }, labelPersen) : null,
    );
    daftar.append(barItem);
  }

  if (cakupanBerbeda) {
    daftar.append(el('p', { class: 'catatan-cakupan-beda' },
      ikon('info'),
      'Perhatian: Cakupan pos di atas berbeda. Angka tidak dapat langsung diperbandingkan sebagai persentase penyerapan.',
    ));
  }

  wadah.append(daftar);
}

// Grafik Komposisi (Proporsi Total)
function renderGrafikKomposisi(wadah, items, { onBukaSumber, el }) {
  const total = items.reduce((sum, i) => sum + i.nilai, 0) || 1;
  const barSegmented = el('div', { class: 'komposisi-bar' });
  const legenda = el('div', { class: 'komposisi-legenda' });

  const palet = ['#1d4ed8', '#7dd3fc', '#10b981', '#f59e0b', '#8b5cf6'];

  items.forEach((item, idx) => {
    const proporsi = (item.nilai / total) * 100;
    const warna = palet[idx % palet.length];

    // Segmen batang
    const segmen = el('div', {
      class: 'komposisi-segmen',
      style: `width: ${proporsi}%; background: ${warna}`,
      title: `${item.pos}: ${formatNilai(item)} (${formatAngka(proporsi, 1)}%)`,
    });
    barSegmented.append(segmen);

    // Legenda interaktif
    const itemLegenda = el('button', {
      type: 'button',
      class: 'legenda-item-btn',
      onclick: () => onBukaSumber(item),
    },
      el('span', { class: 'legenda-dot', style: `background: ${warna}` }),
      el('span', { class: 'legenda-nama' }, item.pos),
      el('strong', { class: 'legenda-nilai' }, `${formatNilai(item)} (${formatAngka(proporsi, 1)}%)`),
      el('span', { class: 'ikon-link-sumber' }, ikon('dokumen')),
    );
    legenda.append(itemLegenda);
  });

  wadah.append(barSegmented, legenda);
}

// Grafik Garis (Tren Periode Berjalan)
function renderGrafikGaris(wadah, items, { onBukaSumber, el }) {
  if (items.length < 2) {
    return renderGrafikBatang(wadah, items, false, { onBukaSumber, el });
  }

  const maxVal = Math.max(...items.map((i) => i.nilai), 1);
  const minVal = Math.min(...items.map((i) => i.nilai), 0);
  const range = maxVal - minVal || 1;

  // Bangun SVG garis responsif
  const w = 400;
  const h = 180;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = w - paddingX * 2;
  const chartH = h - paddingY * 2;

  const points = items.map((item, idx) => {
    const x = paddingX + (idx / (items.length - 1)) * chartW;
    const y = h - paddingY - ((item.nilai - minVal) / range) * chartH;
    return { x, y, item };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'grafik-svg-garis');

  // Garis path
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#2563eb');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  svg.append(path);

  // Titik koordinat + label
  const containerTitik = el('div', { class: 'garis-titik-list' });

  points.forEach((p) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('stroke', '#1d4ed8');
    circle.setAttribute('stroke-width', '2.5');
    svg.append(circle);

    const btn = el('button', {
      type: 'button',
      class: 'titik-data-btn',
      onclick: () => onBukaSumber(p.item),
    },
      el('span', { class: 'titik-periode' }, p.item.posisi_data ?? `TA ${p.item.tahun_anggaran}`),
      el('strong', {}, formatNilai(p.item)),
    );
    containerTitik.append(btn);
  });

  wadah.append(svg, containerTitik);
}

// Kartu Angka Tunggal
function renderKartuAngka(wadah, item, { onBukaSumber, el }) {
  const kartu = el('div', { class: 'visual-kartu-angka' },
    el('span', { class: `bar-tag tag-${item.jenis_angka.toLowerCase()}` }, item.jenis_angka),
    el('div', { class: 'kartu-angka-nilai' }, formatNilai(item)),
    el('p', { class: 'kartu-angka-pos' }, `${item.pos} (${item.posisi_data ?? `TA ${item.tahun_anggaran}`})`),
    el('button', {
      type: 'button',
      class: 'tombol tombol-sm tombol-lihat-dokumen',
      onclick: () => onBukaSumber(item),
    }, ikon('dokumen'), 'Periksa dokumen sumber'),
  );
  wadah.append(kartu);
}

// Tabel Data untuk Aksesibilitas
function renderTabelData(wadah, visual, { onBukaSumber, el }) {
  const tabel = el('table', { class: 'tabel-data-visual' },
    el('thead', {},
      el('tr', {},
        el('th', {}, 'Pos Data'),
        el('th', {}, 'Jenis'),
        el('th', {}, 'Periode'),
        el('th', {}, `Nilai (${visual.satuan})`),
        el('th', {}, 'Sumber Resmi'),
      ),
    ),
    el('tbody', {},
      visual.items.map((item) =>
        el('tr', {},
          el('td', { class: 'td-pos' }, item.pos),
          el('td', {}, el('span', { class: `bar-tag tag-${item.jenis_angka.toLowerCase()}` }, item.jenis_angka)),
          el('td', {}, item.posisi_data ?? `TA ${item.tahun_anggaran}`),
          el('td', { class: 'td-nilai' }, formatNilai(item)),
          el('td', {},
            el('button', {
              type: 'button',
              class: 'tombol-teks-tabel',
              onclick: () => onBukaSumber(item),
            }, item.dokumen.slice(0, 32) + '…', ikon('panah')),
          ),
        ),
      ),
    ),
  );
  wadah.append(tabel);
}
