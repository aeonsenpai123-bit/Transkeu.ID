import { artikel } from '../data/artikel.js';
import { normal, retrieve } from './retrieval.js';

export function validArticle(a, now=new Date()) {
  try {
    const u=new URL(a.url);
    const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x).toISOString().slice(0,10)===x;
    return Boolean(u.protocol==='https:' && u.hostname==='melekapbn.org' && !u.username && !u.password && (!u.port || u.port==='443') && /^\/(articles|carousel)\/.+/.test(u.pathname) && a.status==='published' && a.penerbit==='Melek APBN' && typeof a.id==='string' && typeof a.judul==='string' && a.judul.length<300 && typeof a.ringkasan==='string' && a.ringkasan.length<=450 && Array.isArray(a.penulis) && a.penulis.every(x=>typeof x==='string') && Array.isArray(a.topik) && a.topik.every(x=>typeof x==='string') && Array.isArray(a.kata_kunci) && a.kata_kunci.every(x=>typeof x==='string') && Array.isArray(a.tahun_anggaran) && a.tahun_anggaran.every(Number.isInteger) && validDate(a.ditinjau_pada) && a.ditinjau_pada<=now.toISOString().slice(0,10) && (!a.tanggal_terbit || (validDate(a.tanggal_terbit) && a.tanggal_terbit<=now.toISOString().slice(0,10))));
  } catch { return false; }
}
export function relatedArticles(question, history=[], rows=artikel, {now=new Date(),limit=3}={}) {
  // Gunakan pertanyaan asli + resolver follow-up, bukan narasi bebas model.
  const query=normal(retrieve(question,history).question);
  const years=(query.match(/\b20\d{2}\b/g)??[]).map(Number);
  const seen=new Set();
  return rows.filter(a=>validArticle(a,now)).filter(a=>{
    const u=new URL(a.url);u.hash='';u.search='';
    if(seen.has(u.href))return false;seen.add(u.href);return true;
  }).filter(a=>!years.length || !a.tahun_anggaran.length || years.some(y=>a.tahun_anggaran.includes(y)))
    .map(a=>({...a,score:a.kata_kunci.reduce((n,w)=>n+(` ${query} `.includes(` ${normal(w)} `)?2:0),0)}))
    .filter(a=>a.score>=2)
    .sort((a,b)=>b.score-a.score || (b.tanggal_terbit??'').localeCompare(a.tanggal_terbit??'') || a.id.localeCompare(b.id))
    .slice(0,Math.max(0,Math.min(limit,3))).map(({score,kata_kunci,status,...a})=>({...a,peran:'bacaan_pendukung',catatan:'Analisis sumber sekunder; tidak dipakai sebagai dasar angka atau grafik APBN.'}));
}
let pool;
export async function loadArticles({env=process.env,db}={}) {
  if(!env.DATABASE_URL && !db)return artikel;
  if(!db) {
    if(!pool) {
      const {Pool}=await import('pg');
      pool=new Pool({connectionString:env.DATABASE_URL,max:2,connectionTimeoutMillis:1800,idleTimeoutMillis:10000,query_timeout:1800,statement_timeout:1500,allowExitOnIdle:true});
      pool.on('error',()=>console.warn(JSON.stringify({event:'article_db_idle_error'})));
    }
    db=pool;
  }
  const r=await db.query('SELECT * FROM artikel_pendukung WHERE status = $1 ORDER BY ditinjau_pada DESC, id LIMIT $2',['published',300]);
  return r.rows;
}
export async function attachArticles(result, question,history,{env=process.env,logger=console,load=loadArticles}={}) {
  try {
    const rows=await load({env});
    return {...result,bacaan_terkait:relatedArticles(question,history,rows),sumber_bacaan:env.DATABASE_URL?'database':'katalog_lokal'};
  } catch {
    // Artikel opsional: gangguan database tidak boleh menggagalkan jawaban anggaran.
    logger.warn(JSON.stringify({event:'article_catalog_unavailable'}));
    return {...result,bacaan_terkait:[]};
  }
}
