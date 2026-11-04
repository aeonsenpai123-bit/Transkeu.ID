import test from 'node:test';
import assert from 'node:assert/strict';
import { documentUrl, traceEvidence, evidenceText } from '../src/evidence.js';
import { jejakAnggaran } from '../data/jejak.js';
import { retrieve } from '../server/retrieval.js';
import { resolveImpactContext } from '../server/impacts.js';
import { handleQuestion } from '../server/handler.js';
import { susunDrafAspirasi } from '../data/aspirasi.js';
const find = id => jejakAnggaran.find(x => x.id === id);
test('program budget cannot be calculated using the wider scholarship or TKD envelope',()=>{
 for (const id of ['jejak-pip','jejak-kip-kuliah','jejak-bos','jejak-jalan-nasional','jejak-subsidi-energi']) {
  const t=traceEvidence(find(id));assert.equal(t.ratio,null);assert.equal(t.comparable,false);assert.ok(t.warnings.length);
 }
});
test('matching program scope can produce a ratio; missing budget metadata cannot',()=>{
 const item=find('jejak-pbi-jkn');const t=traceEvidence(item);assert.equal(t.comparable,true);assert.ok(t.ratio>=0);
 const copy=structuredClone(item);copy.tahap.alokasi.kutipan='';assert.equal(traceEvidence(copy).ratio,null);
});
test('prior year energy output is explicitly labelled rather than attributed to current spending',()=>{
 const t=traceEvidence(find('jejak-subsidi-energi'));assert.equal(t.stages[2].tahun_anggaran,2025);assert.ok(t.warnings.some(w=>w.includes('bukan hasil belanja')));
});
test('document page deep link preserves the PDF query and rejects unsafe URLs',()=>{
 const url=documentUrl({url:'https://example.go.id/report.pdf?ext=.pdf',halaman_atau_tabel:'hlm. 29'});
 assert.equal(url,'https://example.go.id/report.pdf?ext=.pdf#page=29');assert.equal(documentUrl({url:'javascript:alert(1)'}),null);
});
test('evidence draft keeps type, year, scope, quotation and source; missing reference is not fabricated',()=>{
 const t=traceEvidence(find('jejak-pip'));const proof=evidenceText(t.stages);assert.ok(proof.includes('Realisasi'));assert.ok(proof.includes('Cakupan: paket-beasiswa'));assert.ok(proof.includes('hlm. 29'));assert.ok(proof.includes('https://'));
 const draft=susunDrafAspirasi({topik:'Pendidikan',masalah:'Pertanyaan',masukan:'Mohon penjelasan'});assert.ok(draft.includes('Belum ada dokumen pendukung'));assert.ok(!draft.includes('APBN TA 2026'));
});
test('three-turn follow-up retains topic and a newly explicit year replaces the previous year',()=>{
 const history=[{tanya:'Anggaran pendidikan tahun 2026 berapa?'},{tanya:'Sudah berapa persen?'}];
 const r=retrieve('Kalau tahun 2025?',history);assert.ok(r.question.includes('pendidikan'));assert.ok(!r.question.includes('2026'));assert.ok(r.facts.every(f=>f.tahun_anggaran===2025));assert.ok(r.facts.every(f=>f.topik==='pendidikan'));
});
test('program and year follow-up are retained without leaking a previous program into an unrelated topic',()=>{
 const history=[{tanya:'Apa dampak PIP 2026?'}];assert.equal(resolveImpactContext('Dampaknya?',{},history).program_id,'jejak-pip');assert.equal(resolveImpactContext('Anggaran jalan 2025?',{},history).program_id,undefined);
});
test('basic mode follows the same topic context rather than dropping the previous question',async()=>{
 const result=await handleQuestion({pertanyaan:'Sudah berapa persen?',riwayat:[{tanya:'Anggaran pendidikan 2026 berapa?'}]},{env:{},logger:{warn(){}}});assert.equal(result.body.ai,false);assert.ok(result.body.angka.some(a=>a.topik==='pendidikan'));
});
