// Server kecil: berkas statis + POST /api/tanya (AI). Modul ES tidak bisa dibuka lewat file://.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakta, kegunaan } from '../data/fakta.js';
import { istilah } from '../data/istilah.js';
import { adaKunci, buatPenjawab } from '../src/ai.js';

const akar = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT) || 5173;
const jenis = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };
const tanyaAI = adaKunci() ? buatPenjawab({ fakta, kegunaan, istilah }) : null;

// shortcut: batas harian per IP di memori (hilang saat server mati); pindah ke penyimpanan bersama bila dipakai banyak orang.
const BATAS_HARIAN = Number(process.env.BATAS_TANYA_HARIAN) || 50;
const kuota = new Map();
function bolehTanya(ip) {
  const hari = new Date().toISOString().slice(0, 10);
  const k = kuota.get(ip);
  const n = k?.hari === hari ? k.n + 1 : 1;
  kuota.set(ip, { hari, n });
  return n <= BATAS_HARIAN;
}

const kirimJson = (res, kode, isi) => res.writeHead(kode, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(isi));

async function bacaBadan(req) {
  let teks = '';
  for await (const potong of req) {
    teks += potong;
    if (teks.length > 8000) throw new Error('badan terlalu besar');
  }
  return JSON.parse(teks);
}

async function apiTanya(req, res) {
  if (!tanyaAI) return kirimJson(res, 503, { error: 'ai_mati' });
  if (!bolehTanya(req.socket.remoteAddress)) return kirimJson(res, 429, { error: 'batas_harian' });
  let badan;
  try {
    badan = await bacaBadan(req);
  } catch {
    return kirimJson(res, 400, { error: 'permintaan_tidak_sah' });
  }
  const pertanyaan = String(badan.pertanyaan ?? '').trim().slice(0, 300);
  if (!pertanyaan) return kirimJson(res, 400, { error: 'pertanyaan_kosong' });
  const riwayat = (Array.isArray(badan.riwayat) ? badan.riwayat : [])
    .slice(-3).map((g) => ({ tanya: String(g.tanya ?? '').slice(0, 300), jawab: String(g.jawab ?? '').slice(0, 1500) }))
    .filter((g) => g.tanya && g.jawab);
  try {
    return kirimJson(res, 200, await tanyaAI(pertanyaan, riwayat));
  } catch (e) {
    // Termasuk JawabanDitolak: browser lalu memakai mesin aturan, jadi angka karangan tidak pernah tampil.
    console.error('[api/tanya]', e.name, e.message);
    return kirimJson(res, 502, { error: 'ai_gagal' });
  }
}

createServer(async (req, res) => {
  const jalur = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (jalur === '/api/tanya' && req.method === 'POST') return apiTanya(req, res);
  const berkas = normalize(join(akar, jalur === '/' ? 'index.html' : jalur));
  if (!berkas.startsWith(normalize(akar)) || berkas.includes(`${normalize('/node_modules/')}`) || berkas.includes('.env')) return res.writeHead(403).end();
  try {
    const isi = await readFile(berkas);
    res.writeHead(200, { 'Content-Type': `${jenis[extname(berkas)] ?? 'application/octet-stream'}; charset=utf-8` }).end(isi);
  } catch {
    res.writeHead(404).end('Tidak ditemukan');
  }
}).listen(port, () => console.log(`Transkeu.ID jalan di http://localhost:${port} (AI: ${tanyaAI ? 'aktif' : 'mati, isi ANTHROPIC_API_KEY di .env'})`));
