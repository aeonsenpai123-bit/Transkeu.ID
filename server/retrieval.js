import { fakta, kegunaan } from '../data/fakta.js';
import { istilah } from '../data/istilah.js';
import { topik } from '../data/topik.js';

export const corpus = { fakta, kegunaan, istilah, topik };
export const normal = s => String(s).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const official = host => host === 'kemenkeu.go.id' || host.endsWith('.kemenkeu.go.id') || host === 'peraturan.bpk.go.id' || host === 'data.go.id';
export function factEligible(f) {
  try {
    const u = new URL(f.url);
    return Boolean(f.id && f.pos && f.cakupan && f.jenis_angka && Number.isInteger(f.tahun_anggaran) && Number.isFinite(f.nilai) && f.nilai >= 0 && f.satuan && f.dokumen && f.penerbit && f.kutipan && (f.halaman_atau_tabel || !u.pathname.toLowerCase().endsWith('.pdf')) && (f.jenis_angka !== 'Realisasi' || /^\d{4}-\d{2}-\d{2}$/.test(f.tanggal_posisi ?? '')) && u.protocol === 'https:' && official(u.hostname));
  } catch { return false; }
}
function expanded(text) {
  const t = normal(text);
  return t.replace(/\b(duit|uangku|uangnya)\b/g, 'uang apbn').replace(/\b(dipake|dipakai|kepake|terpakai)\b/g, 'dipakai realisasi belanja').replace(/\b(kuliah|sekolahan|sekolah)\b/g, 'pendidikan kuliah sekolah').replace(/\b(berobat|dokter|rs|bpjs)\b/g, 'kesehatan bpjs').replace(/\b(bensin|elpiji)\b/g, 'subsidi energi bbm lpg');
}
// Dokumen kecil: lexical retrieval dengan perluasan sinonim, bukan embedding atau fine-tuning.
export function retrieve(question, history = [], data = corpus) {
  const q = expanded(question);
  const followup = /^(terus|lalu|kalau|nah|yang|itu|kok|kenapa|jadi|berapa persen|sudah berapa|coba|tampilkan|buatkan|gambarkan|jelasin|jelaskan lagi)/.test(q) && !data.topik.some(t => t.kata_kunci.some(k => q.includes(normal(k))));
  const previous = history.at(-1)?.tanya ?? '';
  const query = followup ? `${expanded(previous)} ${q}` : q;
  const tokens = [...new Set(query.split(' ').filter(w => w.length > 2))];
  const years = [...new Set(query.match(/\b20\d{2}\b/g) ?? [])].map(Number);
  const topics = data.topik.filter(t => t.kata_kunci.some(k => query.includes(normal(k))));
  const specificTopics = topics.filter(t => t.id !== 'umum');
  const eligible = data.fakta.filter(factEligible).filter(f => !specificTopics.length || specificTopics.some(t => t.id === f.topik) || (query.includes('fungsi') && f.kelompok === 'belanja_fungsi' && specificTopics.some(t => normal(f.pos).includes(normal(t.nama)))));
  const score = text => { const t = normal(text); return tokens.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0); };
  let rows = eligible.map(f => ({ f, score: score(`${f.pos} ${f.cakupan} ${f.jenis_angka}`) + (topics.some(t => t.id === f.topik) ? 5 : 0) }));
  if (years.length) rows = rows.filter(({ f }) => years.includes(f.tahun_anggaran));
  // Tambahkan kedua pasangan anggaran/realisasi. Jangan memilih cuma angka yang paling besar.
  rows = rows.filter(r => r.score > 0).sort((a,b) => b.score - a.score || b.f.tahun_anggaran - a.f.tahun_anggaran || (b.f.tanggal_posisi ?? '').localeCompare(a.f.tanggal_posisi ?? ''));
  const facts = rows.slice(0,32).map(r => r.f);
  const contexts = [
    ...data.istilah.map((i,n) => ({ id:`kamus-${n}`, judul:i.istilah, teks:i.arti, internal:true, alias:i.alias ?? [] })),
    ...data.kegunaan.map((k,n) => ({ ...k, id:`kegunaan-${n}`, judul:k.topik, teks:k.teks, internal:false })),
  ].filter(c => !years.length || !c.tahun_anggaran || years.includes(c.tahun_anggaran)).map(c => ({...c, score:score(`${c.judul} ${c.teks} ${c.alias?.join(' ') ?? ''}`)})).filter(c => c.score > 0).sort((a,b) => b.score-a.score).slice(0,10);
  return { facts, contexts, followup, question:query };
}
