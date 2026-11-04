// Endpoint publik yang dipakai halaman /kajian. Tidak memerlukan kredensial.
const API = 'https://api.melekapbn.org';
export async function collectCatalog(kind, {fetchImpl=fetch, maxPages=50}={}) {
  if (!['articles','carousel'].includes(kind)) throw new Error('Jenis katalog tidak diizinkan');
  const found=new Map();let expectedTotal;
  for(let page=1;page<=maxPages;page++) {
    const r=await fetchImpl(`${API}/api/${kind}?page=${page}&limit=100`,{signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!r.ok)throw new Error(`Katalog ${kind} gagal: HTTP ${r.status}`);
    const body=await r.json(),data=body?.data,info=data?.pagination;
    if(body.success!==true || !Array.isArray(data?.data) || !info || info.page!==page || !Number.isInteger(info.total) || info.total<0)throw new Error('Format/paginasi katalog berubah');
    if(expectedTotal!==undefined && expectedTotal!==info.total)throw new Error('Katalog berubah saat sinkronisasi; ulangi');
    expectedTotal=info.total;
    for(const row of data.data) {
      if(typeof row.id!=='string' || found.has(row.id))throw new Error('ID kosong/duplikat lintas halaman');
      // Hanya metadata publik. Isi artikel, gambar, data akun tidak dipersistenkan.
      found.set(row.id,publicMetadata(row,kind));
    }
    if(info.hasNext===false) {
      if(found.size!==expectedTotal)throw new Error('Katalog tidak lengkap');
      return [...found.values()].filter(Boolean);
    }
    if(!data.data.length)throw new Error('Halaman kosong sebelum akhir katalog');
  }
  throw new Error('Batas halaman terlampaui; jangan menulis snapshot parsial');
}
export function publicMetadata(row,kind,now=new Date()) {
  if(row.status!=='published'||row.is_deleted||row.deleted_at)return null;
  if(typeof row.title!=='string'||!row.title.trim()||typeof row.slug!=='string'||!/^[@a-zA-Z0-9][@a-zA-Z0-9/_-]*$/.test(row.slug)||row.slug.includes('..'))throw new Error('Metadata publik tidak valid');
  const date=row.published_at?new Date(row.published_at):null;
  if(date && (!Number.isFinite(date.getTime())||date>now))return null;
  const authors=(row.authors??[]).map(a=>a.name).filter(x=>typeof x==='string');
  const tags=(row.tags??[]).map(t=>typeof t==='string'?t:t.name).filter(x=>typeof x==='string');
  return {source_id:row.id,judul:row.title.replace(/\s+/g,' ').trim().slice(0,299),slug:row.slug,jenis:kind==='articles'?'analisis':'carousel',url:`https://melekapbn.org/${kind}/${row.slug}`,penulis:authors,tanggal_terbit:date?.toISOString().slice(0,10)??null,kategori:row.category?.name??null,tags:tags.slice(0,30)};
}
