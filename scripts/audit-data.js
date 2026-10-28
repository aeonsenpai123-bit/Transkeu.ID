import { corpus, factEligible } from '../server/retrieval.js';

const excluded = corpus.fakta.filter(f => !factEligible(f));
console.log(JSON.stringify({
  note: 'Audit struktur/metadata saja, bukan verifikasi isi PDF atau akurasi semantik.',
  total: corpus.fakta.length,
  eligible: corpus.fakta.length - excluded.length,
  excluded_ids: excluded.map(f => f.id),
}, null, 2));
