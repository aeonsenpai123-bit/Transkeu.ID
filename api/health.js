import { corpus, factEligible } from '../server/retrieval.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const configured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY);
  const model = process.env.GEMINI_MODEL || process.env.ANTHROPIC_MODEL || (process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'claude-sonnet-4-6');
  res.status(200).json({
    service: 'Transkeu.ID',
    configured,
    limiter_configured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    model,
    eligible_facts: corpus.fakta.filter(factEligible).length,
    note: 'Konfigurasi terdeteksi bukan bukti panggilan model berhasil.',
  });
}
