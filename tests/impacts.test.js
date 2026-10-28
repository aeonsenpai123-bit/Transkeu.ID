import test from 'node:test';
import assert from 'node:assert/strict';
import {validateImpact,selectImpacts,resolveImpactContext,attachImpacts} from '../server/impacts.js';
// Fixture sintetis untuk menguji aturan, bukan bukti program nyata atau isi katalog pengguna.
const sample={id:'test-only',sumber_pendanaan:'APBN',dasar_pendanaan:'Dokumen pendanaan sintetis uji',program_id:'jejak-pip',tahun_anggaran:2026,wilayah_kode:'ID',wilayah:'Nasional',periode:'Periode uji',tingkat:'outcome',arah:'positif',hubungan:'deskriptif',indikator:'Indikator contoh uji',temuan:'Temuan sintetis untuk pengujian.',metode:'Metode contoh',keterbatasan:'Tidak menyimpulkan sebab-akibat.',ditinjau_pada:'2026-10-28',status:'published',sumber:[{jenis:'statistik',url:'https://example.go.id/fixture-only',dokumen:'Dokumen sintetis uji',penerbit:'Penerbit contoh',halaman:'halaman uji',kutipan:'Kutipan sintetis untuk unit test.'}]};
test('bukti belum dimuat tidak berarti program tidak berdampak',()=>{
 const r=selectImpacts({program_id:'jejak-pip',tahun_anggaran:2026});assert.equal(r.status,'belum_tersedia');assert.ok(r.pesan.includes('tidak berarti'));
});
test('nama sektor bukan otomatis nama program',()=>assert.equal(resolveImpactContext('Bagaimana dampak pendidikan 2026?').program_id,undefined));
test('nama program eksplisit dan tahun dikenali',()=>assert.deepEqual(resolveImpactContext('Apa dampak PIP 2026?'),{program_id:'jejak-pip',tahun_anggaran:2026,wilayah_kode:undefined}));
test('tanpa tahun meminta tahun, tidak mengambil periode terbaru diam-diam',()=>assert.equal(selectImpacts({program_id:'jejak-pip'},[sample]).status,'perlu_tahun'));
test('bukti daerah lain tidak dianggap bukti lokal atau nasional',()=>{
 const r={...sample,wilayah_kode:'TEST-REGION',wilayah:'Wilayah fixture'};
 assert.equal(selectImpacts({program_id:'jejak-pip',tahun_anggaran:2026},[r]).bukti.length,0);
 assert.equal(selectImpacts({program_id:'jejak-pip',tahun_anggaran:2026,wilayah_kode:'OTHER'},[sample,r]).bukti.length,0);
});
test('tahun berbeda tidak dipindahkan ke realisasi tahun ini',()=>assert.equal(selectImpacts({program_id:'jejak-pip',tahun_anggaran:2025},[sample]).bukti.length,0));
test('outcome deskriptif sah, tetapi tidak dapat dilabel dampak kausal',()=>{
 assert.equal(validateImpact(sample),true);assert.equal(validateImpact({...sample,tingkat:'dampak'}),false);
 assert.equal(validateImpact({...sample,tingkat:'dampak',hubungan:'kausal',pembanding:'kelompok pembanding',asumsi_identifikasi:'asumsi uji',sumber:[{...sample.sumber[0],jenis:'evaluasi'}]}),true);
});
test('berita/analisis saja bukan bukti evaluasi',()=>assert.equal(validateImpact({...sample,sumber:[{...sample.sumber[0],jenis:'analisis'}]}),false));
test('sumber tanpa kutipan atau halaman ditolak',()=>assert.equal(validateImpact({...sample,sumber:[{...sample.sumber[0],halaman:''}]}),false));
test('draft dan withdrawn tidak ditampilkan',()=>{
 assert.equal(validateImpact({...sample,status:'draft'}),false);assert.equal(validateImpact({...sample,status:'withdrawn'}),false);
});
test('masalah pelaksanaan tidak dipaksa menjadi kesimpulan dampak',()=>{
 const r={...sample,tingkat:'temuan_pelaksanaan',arah:'negatif',sumber:[{...sample.sumber[0],jenis:'audit'}]};assert.equal(validateImpact(r),true);assert.equal(selectImpacts({program_id:'jejak-pip',tahun_anggaran:2026},[r]).bukti[0].tingkat,'temuan_pelaksanaan');
});
test('gangguan katalog bukti tidak merusak jawaban anggaran',async()=>{
 const r=await attachImpacts({ringkas:'Jawaban APBN'},'Dampak PIP 2026?',{}, {load:async()=>{throw new Error();},logger:{warn(){}}});assert.equal(r.ringkas,'Jawaban APBN');assert.equal(r.hasil_lapangan.status,'gangguan_sumber');
});

test('program APBD murni tidak dilabel hasil APBN',()=>assert.equal(validateImpact({...sample,sumber_pendanaan:'APBD'}),false));
