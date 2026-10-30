import { providerConfig } from '../server/provider.js';
import { corpus, factEligible } from '../server/retrieval.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const config = providerConfig(process.env);
  const configured = config.supported && Boolean(config.apiKey);
  const model = config.model ?? null;
  res.status(200).json({
    service: 'Transkeu.ID',
    configured,
    provider: config.provider,
    limiter_configured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    model,
    eligible_facts: corpus.fakta.filter(factEligible).length,
    note: 'Konfigurasi terdeteksi bukan bukti panggilan model berhasil.',
  });
}
