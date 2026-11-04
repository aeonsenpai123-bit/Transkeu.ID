import test from 'node:test';
import assert from 'node:assert/strict';
import { rankingInstansi,hasilInstansi } from '../src/instansi.js';
import { factEligible } from '../server/retrieval.js';
import { handleQuestion } from '../server/handler.js';
import { safeVisual } from '../server/grounding.js';
test('pagu awal bersumber resmi dan konversi ribu rupiah konsisten',()=>{
 const rows=rankingInstansi();assert.equal(rows.length,10);assert.equal(new Set(rows.map(r=>r.ba)).size,10);
 for(const r of rows){assert.ok(factEligible(r));assert.equal(r.nilai,r.nilai_ribu_rupiah/1e9);assert.ok(r.halaman_atau_tabel);assert.equal(r.jenis_angka,'Anggaran');}
 assert.equal(rows[0].ba,'128');assert.equal(rows[0].nilai,268);assert.equal(rows[1].nilai,187.1);
});
test('peringkat kementerian menyaring lembaga dan tidak memutasi data',()=>{const a=rankingInstansi({jenis:'kementerian'});assert.equal(a.length,8);assert.equal(a[0].ba,'012');assert.equal(rankingInstansi()[0].ba,'128');});
test('instansi lain tahun dan realisasi tidak diganti pagu awal',()=>{
 for(const q of ['Belanja kementerian terbesar 2025','Realisasi BGN 2026 berapa?']){const r=hasilInstansi(q);assert.equal(r.status,'tidak_tersedia');assert.deepEqual(r.angka,[]);assert.equal(r.visual,null);}
 assert.equal(hasilInstansi('Belanja pendidikan 2026?'),null);
});
test('tahun eksplisit pada pertanyaan lanjutan mengalahkan riwayat',()=>{
 const r=hasilInstansi('Kalau 2025?', [{tanya:'Anggaran BGN 2026 berapa?'}]);assert.equal(r.status,'tidak_tersedia');assert.match(r.alasan,/2025/);
});
test('pertanyaan instansi diproses sebagai fakta tanpa kuota LLM atau angka rekaan',async()=>{
 const r=await handleQuestion({pertanyaan:'Instansi mana dengan anggaran terbesar 2026?'},{env:{},logger:{warn(){}}});assert.equal(r.code,200);assert.equal(r.body.angka[0].ba,'128');assert.equal(r.body.mode,'data_resmi');assert.ok(r.body.belanja_instansi);
 const items=r.body.angka;assert.ok(safeVisual({tipe:'batang',judul:'Pagu instansi',fakta_ids:items.map(r=>r.id)},new Map(items.map(r=>[r.id,r]))));
});

test('kementerian yang belum dimuat tidak diganti instansi lain',()=>{assert.equal(hasilInstansi('Berapa anggaran Kementerian Pariwisata 2026?').status,'tidak_tersedia');assert.equal(hasilInstansi('Kementerian mana yang anggarannya paling besar 2026?').angka[0].ba,'012');});
