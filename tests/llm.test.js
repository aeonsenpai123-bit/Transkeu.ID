import test from 'node:test';
import assert from 'node:assert/strict';
import { corpus, retrieve, factEligible } from '../server/retrieval.js';
import { compileAnswer, safeVisual } from '../server/grounding.js';
import { explain } from '../server/llm.js';
import { handleQuestion, validateInput, allowRequest } from '../server/handler.js';
import api from '../api/tanya.js';
const ang=corpus.fakta.find(f=>f.id==='pendidikan-2026-anggaran');
const real=corpus.fakta.find(f=>f.topik==='pendidikan'&&f.jenis_angka==='Realisasi'&&f.tahun_anggaran===2026&&f.cakupan===ang.cakupan);
assert.ok(ang&&real);
const evidence={facts:[ang,real],contexts:[]};
const plan=()=>({status:'ok',paragraf:[{teks:`Untuk pendidikan, rencananya {{nilai:${ang.id}}}. Yang sudah dipakai {{periode:${real.id}}} sebesar {{nilai:${real.id}}}, atau {{persen:${real.id}|${ang.id}}} dari rencana. Ini menunjukkan penyerapan, bukan bukti dampak pendidikan.`,source_ids:[ang.id,real.id]}],visual:{tipe:'batang',judul:'Rencana dan yang sudah dipakai',fakta_ids:[ang.id,real.id]},lanjutan:['Apa bedanya dengan hasil program?']});
const quiet={warn(){}};
function response(p=plan()) {return {ok:true,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(p)}]})};}

test('angka, periode, rasio, sumber, dan grafik berasal dari data yang sama',()=>{
 const r=compileAnswer(plan(),evidence);assert.ok(r.ai);assert.equal(r.visual.items.length,2);assert.equal(r.sumber.length,2);assert.ok(!r.ringkas.includes('{{'));assert.ok(r.hitung.hasil>0);assert.equal(r.angka[0].nilai,ang.nilai);
});
test('digit literal yang dikarang ditolak',()=>{
 const p=plan();p.paragraf[0].teks='Anggarannya Rp9999 triliun';assert.throws(()=>compileAnswer(p,evidence),/ungrounded_number/);
});
test('tahun literal juga ditolak: tidak membuat validasi angka longgar',()=>{
 const p=plan();p.paragraf[0].teks='Ini tahun 2027';assert.throws(()=>compileAnswer(p,evidence),/ungrounded_number/);
});
test('URL model tidak diteruskan ke pengguna',()=>{
 const p=plan();p.paragraf[0].teks='Buka https://contoh.invalid';assert.throws(()=>compileAnswer(p,evidence),/ungrounded_number_or_url/);
});
test('placeholder yang tidak dikutip ditolak',()=>{
 const p=plan();p.paragraf[0].source_ids=[ang.id];assert.throws(()=>compileAnswer(p,evidence),/placeholder_uncited/);
});
test('sumber tidak dikenal ditolak',()=>{
 const p=plan();p.paragraf[0].source_ids.push('palsu');assert.throws(()=>compileAnswer(p,evidence),/source_unknown/);
});
test('kalimat faktual tanpa sumber ditolak',()=>{
 const p=plan();p.paragraf[0]={teks:'Anggaran meningkat.',source_ids:[]};assert.throws(()=>compileAnswer(p,evidence),/paragraph_uncited/);
});
test('rasio beda cakupan, tahun, dan satuan ditolak',()=>{
 for(const change of [{cakupan:'lain'},{tahun_anggaran:2025},{satuan:'Rp miliar'}])assert.throws(()=>compileAnswer(plan(),{facts:[ang,{...real,...change}],contexts:[]}),/calculation_scope/);
});
test('grafik tidak boleh mengambil fakta yang tidak dikutip',()=>{
 const p=plan();p.visual.fakta_ids.push('tidak-ada');const r=compileAnswer(p,evidence);assert.equal(r.visual,null);assert.equal(r.visual_warning,'visual_unknown_id');assert.ok(r.ai);
});
test('grafik beda cakupan ditolak tanpa membuang narasi yang sah',()=>{
 const p=plan();p.paragraf[0].teks=`Tersedia {{nilai:${ang.id}}} dan {{nilai:${real.id}}}. Cakupannya berbeda.`;
 const r=compileAnswer(p,{facts:[ang,{...real,cakupan:'lain'}],contexts:[]});assert.equal(r.visual,null);assert.equal(r.visual_warning,'visual_scope_mismatch');
});
test('grafik menolak satuan campuran',()=>assert.throws(()=>safeVisual(plan().visual,new Map([[ang.id,ang],[real.id,{...real,satuan:'Rp miliar'}]])),/unit_mismatch/));
test('garis memerlukan seri yang setara dan tanggal berbeda',()=>assert.throws(()=>safeVisual({...plan().visual,tipe:'garis'},new Map([[ang.id,ang],[real.id,real]])),/series_mismatch/));
test('grafik garis diurutkan berdasarkan waktu',()=>{
 const a={...real,id:'lama',tanggal_posisi:'2026-01-31',posisi_data:'s.d. Januari'};
 const r=safeVisual({tipe:'garis',judul:'Realisasi per waktu',fakta_ids:[real.id,a.id]},new Map([[real.id,real],[a.id,a]]));assert.equal(r.items[0].id,'lama');
});
test('metadata tak lengkap dan URL nonresmi tidak masuk evidence',()=>{
 assert.equal(factEligible({...ang,url:'https://evil.invalid/file.pdf'}),false);assert.equal(factEligible({...ang,halaman_atau_tabel:null}),false);assert.equal(factEligible({...ang,nilai:Infinity}),false);
});
test('retrieval mendukung sinonim dan tahun eksplisit',()=>{
 const r=retrieve('Duit buat sekolah tahun 2026 berapa?');assert.ok(r.facts.some(f=>f.topik==='pendidikan'));assert.ok(r.facts.every(f=>f.tahun_anggaran===2026));
});
test('pertanyaan lanjutan memakai pertanyaan sebelumnya, bukan klaim jawabannya',()=>{
 const r=retrieve('Sudah berapa persen?',[{tanya:'Anggaran pendidikan 2026 berapa?',jawab:'Rp9999 triliun'}]);assert.ok(r.facts.some(f=>f.topik==='pendidikan'));assert.ok(!JSON.stringify(r).includes('9999'));
});
test('respons provider tersambung, tervalidasi, dan kontrak UI lama tetap tersedia',async()=>{
 let payload;const result=await explain('Jelaskan pendidikan',[],evidence,{env:{ANTHROPIC_API_KEY:'test-only'},fetchImpl:async(url,options)=>{payload=JSON.parse(options.body);assert.equal(url,'https://api.anthropic.com/v1/messages');return response();}});
 assert.equal(payload.output_config.format.type,'json_schema');assert.equal(result.status,'ok');assert.equal(result.ai,true);assert.ok(result.ringkas);assert.ok(Array.isArray(result.paragraf));
});
test('respons provider Gemini tersambung dan tervalidasi dengan skema JSON',async()=>{
 let geminiUrl, geminiPayload;const result=await explain('Jelaskan pendidikan',[],evidence,{env:{GEMINI_API_KEY:'test-gemini-key'},fetchImpl:async(url,options)=>{geminiUrl=url;geminiPayload=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(plan())}]}}]})};}});
 assert.ok(geminiUrl.includes('generativelanguage.googleapis.com'));assert.equal(geminiPayload.generationConfig.responseMimeType,'application/json');assert.equal(result.status,'ok');assert.equal(result.ai,true);assert.ok(result.ringkas);
});
test('satu kesempatan perbaikan setelah validator menolak',async()=>{
 let calls=0;const result=await explain('Jelaskan',[],evidence,{env:{ANTHROPIC_API_KEY:'test-only'},fetchImpl:async()=>{calls++;const p=plan();if(calls===1)p.paragraf[0].teks='Rp999 triliun';return response(p);}});assert.equal(calls,2);assert.ok(result.ai);
});
test('jawaban tetap gagal grounding berakhir dengan error terkontrol',async()=>{
 await assert.rejects(explain('Jelaskan',[],evidence,{env:{ANTHROPIC_API_KEY:'test-only'},fetchImpl:async()=>{const p=plan();p.paragraf[0].teks='Rp999 triliun';return response(p);}}),/grounding_failed/);
});
test('provider auth gagal tidak membocorkan body provider',async()=>{
 await assert.rejects(explain('Jelaskan',[],evidence,{env:{ANTHROPIC_API_KEY:'test-only'},fetchImpl:async()=>({ok:false,status:401,json:async()=>({secret:'sensitive'})})}),/provider_auth/);
});
test('tanpa API key menandai Mode Dasar, tidak mengaku LLM',async()=>{
 const r=await handleQuestion({pertanyaan:'Anggaran pendidikan 2026 berapa?'},{env:{},logger:quiet});assert.equal(r.body.ai,false);assert.ok(r.body.catatan_mode.includes('belum diaktifkan'));
});
test('history dan pertanyaan dibatasi',()=>{
 assert.throws(()=>validateInput({pertanyaan:' '}));assert.throws(()=>validateInput({pertanyaan:'a'.repeat(1201)}));assert.equal(validateInput({pertanyaan:'Pajak?',riwayat:[{tanya:'x',jawab:'untrusted'}]}).riwayat[0].jawab,undefined);
});
test('production harus memakai rate limiter lintas instance',async()=>{
 await assert.rejects(allowRequest('ip',{VERCEL:'1'}),/limiter_not_configured/);
});
test('rate limiter terpusat menolak hit di atas batas',async()=>{
 const allowed=await allowRequest('ip',{UPSTASH_REDIS_REST_URL:'https://redis.example',UPSTASH_REDIS_REST_TOKEN:'test',BATAS_TANYA_HARIAN:'2'},async()=>({ok:true,json:async()=>({result:3})}));assert.equal(allowed,false);
});
test('endpoint JSON rusak mengembalikan 400',async()=>{
 let status,body;const res={setHeader(){},status(n){status=n;return this;},json(x){body=x;return this;}};await api({method:'POST',headers:{'content-type':'application/json'},body:'{'},res);assert.equal(status,400);assert.ok(body.error);
});

test('tahun yang tidak punya data pendidikan tidak diganti angka pajak',()=>assert.equal(retrieve('Duit buat sekolah tahun 2025 berapa?').facts.length,0));

const openaiResponse = (p=plan()) => ({ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(p)}]}]})});
test('OpenAI Responses memakai kontrak grafik dan sumber yang sama',async()=>{
 let sent;
 const result=await explain('Duit sekolah berapa?',[],evidence,{env:{OPENAI_API_KEY:'test-only'},fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-only');sent=JSON.parse(options.body);return openaiResponse();
 }});
 assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);assert.equal(sent.text.format.type,'json_schema');assert.ok(sent.instructions.includes('bahasa sehari-hari'));assert.ok(result.ai);assert.equal(result.visual.items.length,2);assert.equal(result.sumber.length,2);
});
test('OpenAI dapat memperbaiki angka yang ditolak pemeriksaan sumber',async()=>{
 let calls=0;
 const result=await explain('Anggaran?',[],evidence,{env:{OPENAI_API_KEY:'test-only'},fetchImpl:async()=>{calls++;const p=plan();if(calls===1)p.paragraf[0].teks='Rp999 triliun';return openaiResponse(p);}});
 assert.equal(calls,2);assert.ok(result.ai);
});
test('OpenAI tidak meneruskan jawaban terpotong atau penolakan',async()=>{
 for(const result of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'private'}]}]}]) {
  await assert.rejects(explain('Anggaran?',[],evidence,{env:{OPENAI_API_KEY:'test-only'},fetchImpl:async()=>({ok:true,json:async()=>result})}),/provider_incomplete|provider_refusal/);
 }
});
test('provider eksplisit tidak mengambil kunci provider lain',async()=>{
 await assert.rejects(explain('Anggaran?',[],evidence,{env:{LLM_PROVIDER:'openai',GEMINI_API_KEY:'test-only'},fetchImpl:async()=>{throw new Error('tidak boleh dipanggil');}}),/missing_api_key/);
});
test('kunci dari browser diabaikan, aktivasi hanya dari server',async()=>{
 const result=await handleQuestion({pertanyaan:'Anggaran pendidikan?',api_key:'sk-test-browser'},{env:{},logger:quiet});assert.equal(result.body.ai,false);assert.equal(validateInput({pertanyaan:'Pajak?',api_key:'sk-test'}).api_key,undefined);
});
test('OpenAI terhubung sampai handler dan limiter produksi',async()=>{
 const r=await handleQuestion({pertanyaan:'Anggaran pendidikan 2026 berapa?'},{env:{LLM_PROVIDER:'openai',OPENAI_API_KEY:'test-only',VERCEL:'1',UPSTASH_REDIS_REST_URL:'https://redis.example',UPSTASH_REDIS_REST_TOKEN:'test-only'},logger:quiet,fetchImpl:async(url)=>url==='https://redis.example'?{ok:true,json:async()=>({result:1})}:openaiResponse()});
 assert.equal(r.code,200);assert.equal(r.body.ai,true);assert.ok(r.body.sumber.length);
});
test('handler tidak membuka AI berbayar tanpa limiter produksi',async()=>{
 const r=await handleQuestion({pertanyaan:'Pajak?'},{env:{OPENAI_API_KEY:'test-only',VERCEL:'1'},logger:quiet,fetchImpl:async()=>{throw new Error('provider tidak boleh dipanggil');}});assert.equal(r.body.ai,false);assert.match(r.body.catatan_mode,/Batas pemakaian/);
});
