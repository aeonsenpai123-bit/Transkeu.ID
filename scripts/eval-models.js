// Skrip evaluasi komparasi model baseline vs model kandidat (hanya berjalan penuh jika API key tersedia di env).
import { retrieve } from '../server/retrieval.js';
import { explain } from '../server/llm.js';
import { providerConfig } from '../server/provider.js';

export const SET_UJI_EVAL = [
  { id: 'pendidikan-total', q: 'Berapa anggaran pendidikan 2026 dan sudah terpakai berapa?', expectedStatus: 'ok', forbidPercent: false },
  { id: 'pip-cakupan', q: 'Berapa persen penyerapan dana PIP 2026?', expectedStatus: 'ok', forbidPercent: true },
  { id: 'pendidikan-ambigu', q: 'Berapa anggaran pendidikan?', expectedStatus: 'ok', expectClarification: true },
  { id: 'followup-tahun-lalu', q: 'Kalau tahun sebelumnya?', history: [{ tanya: 'Berapa anggaran pendidikan 2026?' }], expectedStatus: 'tidak_tersedia' },
  { id: 'jaktim-lokal', q: 'Berapa dana PIP untuk sekolah di Jakarta Timur 2026?', expectedStatus: 'tidak_tersedia' },
  { id: 'konsep-pagu', q: 'Apa beda pagu dan realisasi?', expectedStatus: 'ok', forbidVisualBar: true },
];

const HARGA_ESTIMASI_PER_1M = {
  'gemini-2.5-flash': { inputUsd: 0.30, outputUsd: 2.50 },
  'gemini-2.5-pro': { inputUsd: 1.25, outputUsd: 10.00 },
  'gpt-4.1-mini': { inputUsd: 0.40, outputUsd: 1.60 },
};

async function runSuite(provider, model, apiKey) {
  const results = [];
  for (const item of SET_UJI_EVAL) {
    const evidence = retrieve(item.q, item.history ?? []);
    const started = performance.now();
    try {
      const res = await explain(item.q, item.history ?? [], evidence, {
        env: {
          ...process.env,
          LLM_PROVIDER: provider,
          GEMINI_MODEL: provider === 'gemini' ? model : process.env.GEMINI_MODEL,
          OPENAI_MODEL: provider === 'openai' ? model : process.env.OPENAI_MODEL,
          ANTHROPIC_MODEL: provider === 'anthropic' ? model : process.env.ANTHROPIC_MODEL,
          GEMINI_API_KEY: provider === 'gemini' ? apiKey : process.env.GEMINI_API_KEY,
          OPENAI_API_KEY: provider === 'openai' ? apiKey : process.env.OPENAI_API_KEY,
          ANTHROPIC_API_KEY: provider === 'anthropic' ? apiKey : process.env.ANTHROPIC_API_KEY,
        },
      });
      const latencyMs = Math.round(performance.now() - started);
      const validRatioRule = !item.forbidPercent || !res.hitung;
      const validUnavailable = item.expectedStatus !== 'tidak_tersedia' || res.status_jawaban === 'tidak_tersedia';
      const hasCitations = res.status_jawaban !== 'ok' || (Array.isArray(res.sumber) && res.sumber.length > 0);
      results.push({ id: item.id, ok: validRatioRule && validUnavailable && hasCitations, status: res.status_jawaban, latencyMs, visual: res.visual?.tipe ?? null });
    } catch (err) {
      results.push({ id: item.id, ok: false, error: err.code ?? err.message, latencyMs: Math.round(performance.now() - started) });
    }
  }
  return results;
}

const config = providerConfig(process.env);
const candidateModel = process.env.GEMINI_CANDIDATE_MODEL || null;

if (!config.apiKey) {
  console.log(JSON.stringify({
    status: 'skipped_no_credentials',
    baseline: { provider: config.provider, model: config.model },
    candidate: candidateModel,
    pricing_reference_usd_per_1m_tokens: HARGA_ESTIMASI_PER_1M,
    questions: SET_UJI_EVAL.map(x => ({ id: x.id, q: x.q })),
    note: 'Kredensial provider belum tersedia di environment. Pertahankan baseline aktif; isi GEMINI_API_KEY dan GEMINI_CANDIDATE_MODEL di server untuk menjalankan benchmark langsung.',
  }, null, 2));
} else {
  const baselineResults = await runSuite(config.provider, config.model, config.apiKey);
  const candidateResults = candidateModel ? await runSuite(config.provider, candidateModel, config.apiKey) : null;
  console.log(JSON.stringify({ status: 'completed', baseline: { model: config.model, results: baselineResults }, candidate: candidateModel ? { model: candidateModel, results: candidateResults } : null }, null, 2));
}
