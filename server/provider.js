// Pilihan eksplisit tidak berpindah provider diam-diam bila kuncinya belum tersedia.
export function providerConfig(env = process.env) {
  const keys = { openai: env.OPENAI_API_KEY, gemini: env.GEMINI_API_KEY || env.GOOGLE_API_KEY, anthropic: env.ANTHROPIC_API_KEY };
  const provider = env.LLM_PROVIDER || Object.keys(keys).find(p => keys[p]) || 'openai';
  const models = { openai: env.OPENAI_MODEL || 'gpt-4.1-mini', gemini: env.GEMINI_MODEL || 'gemini-2.5-flash', anthropic: env.ANTHROPIC_MODEL || 'claude-sonnet-4-6' };
  return { provider, model: models[provider], apiKey: keys[provider], supported: Object.hasOwn(keys, provider) };
}
