import { providerConfig } from './provider.js';
import { attachImpacts } from './impacts.js';
import { attachArticles } from './articles.js';
import { createHash, randomUUID } from 'node:crypto';
import { corpus, retrieve } from './retrieval.js';
import { explain } from './llm.js';
import { jawab } from '../src/mesin.js';

const counters = new Map();

export function validateInput(body) {
  if (!body || typeof body.pertanyaan !== 'string' || !body.pertanyaan.trim() || body.pertanyaan.length > 1200) throw new Error('invalid_input');
  const riwayat = Array.isArray(body.riwayat) ? body.riwayat.slice(-3).filter(h => h && typeof h.tanya === 'string' && h.tanya.length <= 1200).map(h => ({ tanya: h.tanya })) : [];
  const raw = body.konteks_lapangan ?? {};
  const konteks_lapangan = {
    program_id: typeof raw.program_id === 'string' ? raw.program_id.slice(0, 80) : undefined,
    tahun_anggaran: Number.isInteger(raw.tahun_anggaran) ? raw.tahun_anggaran : undefined,
    wilayah_kode: typeof raw.wilayah_kode === 'string' ? raw.wilayah_kode.slice(0, 40) : undefined,
  };
  return { pertanyaan: body.pertanyaan.trim(), riwayat, konteks_lapangan };
}

export async function allowRequest(ip, env = process.env, fetchImpl = fetch) {
  const limit = Math.max(1, Math.min(1000, Number(env.BATAS_TANYA_HARIAN) || 50));
  const key = 'transkeu:' + createHash('sha256').update(`${env.RATE_LIMIT_SALT ?? 'local'}|${ip}|${new Date().toISOString().slice(0, 10)}`).digest('hex');
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],90000) end; return n";
    const r = await fetchImpl(env.UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(['EVAL', script, '1', key]),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error('limiter_unavailable');
    const data = await r.json();
    if (data.error || !Number.isInteger(data.result)) throw new Error('limiter_unavailable');
    return data.result <= limit;
  }
  // Memori bukan batas lintas-instance: hanya untuk pengembangan lokal.
  if (env.VERCEL || env.NODE_ENV === 'production') throw new Error('limiter_not_configured');
  const today = new Date().toISOString().slice(0, 10);
  for (const [k, v] of counters) if (v.day !== today) counters.delete(k);
  if (counters.size > 10000) throw new Error('limiter_capacity');
  const n = (counters.get(key)?.n ?? 0) + 1;
  counters.set(key, { day: today, n });
  return n <= limit;
}

const notes = {
  missing_api_key: 'Layanan AI belum diaktifkan oleh pengelola.',
  provider_auth: 'Konfigurasi akses layanan AI perlu diperiksa pengelola.',
  provider_limit: 'Layanan AI sedang mencapai batas pemakaian.',
  provider_config: 'Konfigurasi model AI perlu diperiksa pengelola.',
  grounding_failed: 'Penjelasan AI belum lolos pemeriksaan sumber.',
  provider_incomplete: 'Penjelasan AI belum selesai diproses.',
  provider_refusal: 'Pertanyaan ini belum dapat dijawab oleh layanan AI.',
  limiter_not_configured: 'Batas pemakaian AI belum disiapkan oleh pengelola.',
  limiter_unavailable: 'Layanan pembatas pemakaian AI sedang tidak tersedia.',
};

export async function handleQuestion(body, { env = process.env, ip = 'local', fetchImpl = fetch, logger = console } = {}) {
  const request_id = randomUUID();
  let input;
  try {
    input = validateInput(body);
  } catch {
    return { code: 400, body: { error: 'Pertanyaan kosong atau terlalu panjang.' } };
  }

  const finish = async result => ({
    code: 200,
    body: await attachImpacts(await attachArticles(result, input.pertanyaan, input.riwayat, { env, logger }), input.pertanyaan, input.konteks_lapangan, { env, logger }),
  });

  const fallback = code => ({
    ...jawab(input.pertanyaan, corpus),
    ai: false,
    mode: 'dasar',
    catatan_mode: notes[code] ?? 'Layanan AI sedang tidak tersedia.',
    request_id,
  });

  const activeEnv = env;
  const config = providerConfig(activeEnv);
  if (!config.supported) return finish(fallback('provider_config'));
  const hasKey = Boolean(config.apiKey);
  if (!hasKey) return finish(fallback('missing_api_key'));

  try {
    const allowed = await allowRequest(ip, activeEnv, fetchImpl);

    if (!allowed) return finish({ ...fallback('provider_limit'), rate_limited: true });
    const evidence = retrieve(input.pertanyaan, input.riwayat);
    const result = await explain(input.pertanyaan, input.riwayat, evidence, { env: activeEnv, fetchImpl });
    return finish({ ...result, request_id });
  } catch (e) {
    const code = e.code ?? (['limiter_not_configured', 'limiter_unavailable'].includes(e.message) ? e.message : 'internal_error');
    logger.warn(JSON.stringify({ event: 'llm_fallback', request_id, code }));
    return finish(fallback(code));
  }
}
