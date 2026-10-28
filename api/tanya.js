import { handleQuestion } from '../server/handler.js';

export const config = { maxDuration: 45 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gunakan POST.' });
  }
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
    return res.status(415).json({ error: 'Gunakan JSON.' });
  }
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'JSON tidak valid.' });
  }
  if (Buffer.byteLength(JSON.stringify(body ?? {})) > 24000) {
    return res.status(413).json({ error: 'Permintaan terlalu besar.' });
  }
  const ip = req.headers['x-real-ip'] ?? req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? 'unknown';
  const result = await handleQuestion(body, { ip });
  return res.status(result.code).json(result.body);
}
