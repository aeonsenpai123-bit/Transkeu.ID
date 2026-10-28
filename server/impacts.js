import { buktiLapangan } from '../data/bukti-lapangan.js';
import { jejakAnggaran } from '../data/jejak.js';
import { normal } from './retrieval.js';
const programs=new Set(jejakAnggaran.map(p=>p.id));
export function validateImpact(r) {
  if(!r || r.status!=='published' || !programs.has(r.program_id) || !Number.isInteger(r.tahun_anggaran) || !['output','outcome','dampak','temuan_pelaksanaan'].includes(r.tingkat) || !['positif','negatif','campuran','tidak_terdeteksi'].includes(r.arah) || !['deskriptif','asosiasi','kausal'].includes(r.hubungan))return false;
  if(!['APBN','campuran'].includes(r.sumber_pendanaan) || !r.dasar_pendanaan)return false;
  if(!r.wilayah_kode || !r.wilayah || !r.periode || !r.temuan || !r.indikator || !r.metode || !r.keterbatasan || !r.ditinjau_pada)return false;
  if(r.tingkat==='dampak' && (r.hubungan!=='kausal' || !r.pembanding || !r.asumsi_identifikasi))return false;
  if(!Array.isArray(r.sumber)||!r.sumber.length)return false;
  const hasPrimary=r.sumber.some(s=>['evaluasi','audit','statistik','laporan_program'].includes(s.jenis));
  if(!hasPrimary || (r.tingkat==='dampak' && !r.sumber.some(s=>s.jenis==='evaluasi')))return false;
  return r.sumber.every(s=>{try{const u=new URL(s.url);return Boolean(u.protocol==='https:'&&!u.username&&!u.password&&s.dokumen&&s.penerbit&&s.halaman&&s.kutipan);}catch{return false;}});
}
export function selectImpacts(context={},rows=buktiLapangan) {
  const {program_id,tahun_anggaran,wilayah_kode}=context;
  if(!programs.has(program_id))return {status:'perlu_program',pesan:'Pilih program yang ingin diperiksa. Sebutkan wilayah dan tahun agar bukti yang dicari sesuai.',bukti:[]};
  if(!Number.isInteger(tahun_anggaran))return {status:'perlu_tahun',pesan:'Tentukan tahun anggaran program yang ingin diperiksa.',bukti:[]};
  const available=rows.filter(validateImpact).filter(r=>r.program_id===program_id&&r.tahun_anggaran===tahun_anggaran);
  const exact=available.filter(r=>wilayah_kode?r.wilayah_kode===wilayah_kode:r.wilayah_kode==='ID');
  return {status:exact.length?'tersedia':'belum_tersedia',pesan:exact.length?'Temuan berikut mengikuti cakupan wilayah, periode, dan metode sumbernya.':'Bukti hasil atau dampak terverifikasi untuk program, tahun, dan wilayah ini belum dimuat. Ini tidak berarti program tidak berdampak.',wilayah:wilayah_kode??'ID',cakupan:wilayah_kode?'wilayah_dipilih':'nasional',bukti:exact.slice(0,12)};
}
export function resolveImpactContext(question,provided={},history=[]) {
  const q=normal(question);const year=question.match(/\b20\d{2}\b/)?.[0];
  const aliases={ 'jejak-pip':['pip','program indonesia pintar'], 'jejak-kip-kuliah':['kip kuliah'], 'jejak-bos':['bos','bantuan operasional sekolah'], 'jejak-pkh':['pkh','program keluarga harapan'] };
  // Hanya nama program eksplisit, tidak menyamakan satu sektor dengan satu program.
  const named=jejakAnggaran.find(p=>q.includes(normal(p.nama))) ?? jejakAnggaran.find(p=>(aliases[p.id]??[]).some(a=>` ${q} `.includes(` ${a} `)));
  return {program_id:provided.program_id??named?.id,tahun_anggaran:provided.tahun_anggaran??(year?Number(year):undefined),wilayah_kode:provided.wilayah_kode};
}
export async function loadImpacts({env=process.env}={}) {
  if(!env.DATABASE_URL)return buktiLapangan;
  const {Pool}=await import('pg');
  // Pendekatan pool per handler menghindari koneksi tersisa; data outcome masih kecil.
  const pool=new Pool({connectionString:env.DATABASE_URL,max:1,connectionTimeoutMillis:1200,query_timeout:1500,statement_timeout:1200});
  try {
    const r=await pool.query('SELECT payload FROM bukti_lapangan WHERE status = $1 LIMIT $2',['published',500]);return r.rows.map(r=>r.payload);
  }finally{await pool.end();}
}
export async function attachImpacts(result,question,provided={}, {env=process.env,load=loadImpacts,logger=console}={}) {
  const context=resolveImpactContext(question,provided);
  if(!/dampak|manfaat|hasil program|lapangan|sekitar|masalah|ketepatan sasaran/i.test(question)&&!context.program_id)return result;
  try{return {...result,hasil_lapangan:selectImpacts(context,await load({env}))};}
  catch{logger.warn(JSON.stringify({event:'impact_catalog_unavailable'}));return {...result,hasil_lapangan:{status:'gangguan_sumber',pesan:'Bukti lapangan belum dapat diperiksa saat ini.',bukti:[]}};}
}
