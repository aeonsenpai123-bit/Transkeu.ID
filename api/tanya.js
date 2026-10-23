// Vercel Serverless Function untuk POST /api/tanya
import { tanganiTanya } from '../src/api-handler.js';

export default async function handler(req, res) {
  // CORS & method guard
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'metode_tidak_diizinkan' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  let badan = req.body;
  if (typeof badan === 'string') {
    try {
      badan = JSON.parse(badan);
    } catch {
      return res.status(400).json({ error: 'format_json_tidak_sah' });
    }
  }

  const { kode, isi } = await tanganiTanya({ badan, ip });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(kode).json(isi);
}
