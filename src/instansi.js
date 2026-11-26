import { instansi } from '../data/instansi.js';
import { jejakAnggaran } from '../data/jejak.js';
import { formatNilai } from './hitung.js';

const normal = s => String(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export const CATATAN_INSTANSI =
  'Pagu awal UU APBN 2026, bukan realisasi atau pagu revisi terkini. Daftar ini memuat 10 K/L terbesar; filter "Kementerian saja" menyaring 8 kementerian dari daftar 10 K/L tersebut (bukan menyusun peringkat ulang dari seluruh kementerian). Belanja K/L berbeda dari belanja menurut fungsi, total sektor, transfer ke daerah, dan belanja Bendahara Umum Negara.';

export function rankingInstansi({ jenis = 'semua', tahun = 2026 } = {}) {
  return instansi.filter(r => r.tahun_anggaran === tahun && (jenis === 'semua' || r.jenis_instansi === jenis)).slice().sort((a, b) => b.nilai - a.nilai);
}

export function hasilInstansi(question, history = []) {
  const q = normal(question);
  const mentioned = instansi.find(r => [r.pos, ...r.alias].some(a => ` ${q} `.includes(` ${normal(a)} `)));
  const explicit = /\b(instansi|kementerian|kementrian|lembaga|k l)\b/.test(q) || mentioned;
  const follow = /^(dan|lalu|terus|kalau|yang|itu|dampak|manfaat|hasil|berapa)/.test(q);
  const prev = !explicit && follow ? [...history].reverse().find(h => hasilInstansi(h.tanya)) : null;
  if (!explicit && !prev) return null;
  // Pertanyaan umum tentang lembaga di luar konteks belanja tidak diambil alih.
  if (!mentioned && !prev && !/belanja|anggaran|pagu|terbesar|paling besar|peringkat|ranking/.test(q)) return null;
  const text = prev ? `${normal(prev.tanya).replace(/\b20\d{2}\b/g, '')} ${q}` : q;
  const year = Number(text.match(/\b20\d{2}\b/)?.[0] ?? 2026);
  const jenis = /kementerian|kementrian/.test(text) && !(/lembaga|instansi|k l/.test(text)) ? 'kementerian' : 'semua';
  const focus = mentioned ?? (prev ? instansi.find(r => [r.pos, ...r.alias].some(a => ` ${text} `.includes(` ${normal(a)} `))) : null);
  let rows = rankingInstansi({ jenis, tahun: year });
  if (focus) rows = rows.filter(r => r.ba === focus.ba);
  const unknown = !focus && !/terbesar|paling besar|peringkat|ranking|berdasarkan|per instansi|per kementerian|per kementrian/.test(text);
  const unsupported = /realisasi|terserap|terpakai|sudah (dipakai|dibelanjakan)/.test(q);
  const available = rows.length && !unsupported && !unknown;
  return {
    status: available ? 'ok' : 'tidak_tersedia',
    ai: false,
    mode: 'data_resmi',
    catatan_mode: 'Peringkat dihitung langsung dari tabel dokumen resmi.',
    ringkas: available
      ? (focus ? `${rows[0].pos}: ${formatNilai(rows[0])}.` : `${rows[0].pos} memiliki pagu awal terbesar dalam daftar ini: ${formatNilai(rows[0])}.`)
      : 'Data ini belum tersedia di dokumen yang dimuat Transkeu.ID.',
    pesan: 'Data ini belum tersedia di dokumen yang dimuat Transkeu.ID.',
    alasan: available
      ? null
      : unknown
      ? 'Instansi ini belum dimuat. Coba peringkat kementerian/lembaga terbesar 2026.'
      : unsupported
      ? 'Realisasi per instansi belum dimuat; pagu awal tidak digunakan sebagai penggantinya.'
      : `Pagu awal per instansi untuk TA ${year} belum dimuat.`,
    portal: { nama: 'JDIH Kementerian Keuangan', url: 'https://jdih.kemenkeu.go.id/' },
    angka: available ? rows : [],
    kegunaan: [],
    istilah: [],
    hitung: null,
    batasan: [CATATAN_INSTANSI],
    lanjutan: available ? ['Kementerian saja yang anggarannya paling besar 2026?', 'Apa tujuan anggaran Badan Gizi Nasional 2026?'] : [],
    visual: available && rows.length > 1
      ? { tipe: 'batang', judul: 'Pagu awal kementerian/lembaga', periode: 'TA 2026 · UU APBN', satuan: 'Rp triliun', cakupanBerbeda: false, items: rows }
      : null,
    belanja_instansi: available ? { rows, catatan: CATATAN_INSTANSI } : null,
  };
}

export function renderInstansi(result, { el, onBukaSumber, onTanya, onAspirasi }) {
  if (!result) return null;
  return el('section', { 'aria-label': 'Penggunaan dan hasil belanja instansi', class: 'hasil-lapangan' },
    el('h3', {}, 'Dana instansi dipakai untuk apa?'),
    el('p', { class: 'catatan-kecil' }, result.catatan),
    result.rows.map(r => {
      const p = jejakAnggaran.find(p => p.id === r.jejak_id && p.tahun_anggaran === r.tahun_anggaran);
      const c = p?.tahap.capaian;
      return el('details', { class: 'kartu-bacaan' },
        el('summary', {}, `${r.pos} — ${formatNilai(r)}`),
        el('p', {}, el('strong', {}, 'Tujuan program (UU APBN): '), `${r.program}. ${r.tujuan}`),
        el('p', {},
          el('strong', {}, 'Output resmi: '),
          c?.status === 'tersedia'
            ? `${p.nama}: ${c.output_fisik} (${c.label}). Ini keluaran program terkait sesuai cakupan sumber, bukan seluruh kementerian.`
            : 'Output resmi terverifikasi untuk rincian instansi ini belum dimuat.'
        ),
        el('p', {},
          el('strong', {}, 'Hasil evaluasi: '),
          'Bukti dampak belum tersedia. Pagu, tujuan, dan jumlah penerima tidak membuktikan perubahan kondisi masyarakat. ',
          el('span', { class: 'catatan-kecil' }, `(Perlu dievaluasi: ${r.indikator_evaluasi})`)
        ),
        el('div', { class: 'chips' },
          el('button', { type: 'button', class: 'chip', onclick: () => onBukaSumber(r) }, 'Periksa pagu dan program'),
          c?.status === 'tersedia'
            ? el('button', { type: 'button', class: 'chip', onclick: () => onBukaSumber({ ...c, pos: p.nama, nilai: null, tahun_anggaran: r.tahun_anggaran }) }, 'Periksa sumber capaian')
            : null,
          el('button', {
            type: 'button',
            class: 'chip',
            onclick: () => onTanya(`Apa anggaran, output, dan bukti dampak program ${r.alias[0]} ${r.tahun_anggaran}?`, { program_id: r.jejak_id ?? undefined, tahun_anggaran: r.tahun_anggaran }),
          }, 'Tanya AI dengan konteks ini'),
          onAspirasi
            ? el('button', {
                type: 'button',
                class: 'chip',
                onclick: () => onAspirasi(c?.status === 'tersedia' ? [r, { ...c, pos: p.nama, nilai: null, tahun_anggaran: r.tahun_anggaran }] : [r], p?.topik),
              }, 'Bawa ke Aspirasi Data')
            : null
        )
      );
    }),
    el('a', { href: 'https://www.instagram.com/melek.apbn/', target: '_blank', rel: 'noopener noreferrer' }, 'Referensi edukasi: Instagram Melek APBN (Perlu internet)'),
    el('p', { class: 'catatan-kecil' }, 'Konten Instagram belum diindeks atau diverifikasi. Baca sumber asli sebelum menyimpulkan klaim.')
  );
}
