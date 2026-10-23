// Server lokal: berkas statis + POST /api/tanya (menggunakan handler bersama dengan Vercel)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tanganiTanya } from '../src/api-handler.js';
import { adaKunci } from '../src/ai.js';

const akar = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT) || 5173;
const jenis = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

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
  let badan = {};
  try {
    badan = await bacaBadan(req);
  } catch {
    return kirimJson(res, 400, { error: 'permintaan_tidak_sah' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
  const { kode, isi } = await tanganiTanya({ badan, ip });
  return kirimJson(res, kode, isi);
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
}).listen(port, () => console.log(`Transkeu.ID jalan di http://localhost:${port} (AI: ${adaKunci() ? 'aktif' : 'mati, isi GEMINI_API_KEY di .env'})`));
