import { formatNilai, persenRealisasi } from '../src/hitung.js';

export class GroundingError extends Error { constructor(code) { super(code); this.code=code; } }
const fail = code => { throw new GroundingError(code); };
const same = (items,k) => new Set(items.map(f=>f[k])).size === 1;
export function safeVisual(spec, selected) {
  if (!spec || spec.tipe==='tidak_ada') return null;
  if (!['batang','garis','kartu_angka'].includes(spec.tipe) || !Array.isArray(spec.fakta_ids) || spec.fakta_ids.length>12) fail('visual_schema');
  if (/\p{N}/u.test(spec.judul ?? '')) fail('visual_title_number');
  const ids=[...new Set(spec.fakta_ids)];
  const items=ids.map(id=>selected.get(id) ?? fail('visual_unknown_id'));
  if (!items.length) fail('visual_empty');
  if (!same(items,'satuan')) fail('visual_unit_mismatch');
  if (spec.tipe==='kartu_angka' && items.length!==1) fail('visual_card_count');
  if (spec.tipe==='garis') {
    if (items.length<2 || !same(items,'cakupan') || !same(items,'jenis_angka')) fail('visual_series_mismatch');
    const time=f=>f.jenis_angka==='Realisasi' ? f.tanggal_posisi : String(f.tahun_anggaran);
    if (items.some(f=>!time(f)) || new Set(items.map(time)).size!==items.length) fail('visual_series_dates');
    // Berbeda tahun: bandingkan realisasi hanya untuk tanggal kalender yang sama (atau akhir tahun).
    if (!same(items,'tahun_anggaran') && items[0].jenis_angka==='Realisasi' && new Set(items.map(f=>f.tanggal_posisi.slice(5))).size!==1) fail('visual_series_cutoff');
    items.sort((a,b)=>time(a).localeCompare(time(b)));
  }
  if (spec.tipe==='batang') {
    if (items.length<2 || !same(items,'tahun_anggaran')) fail('visual_year_mismatch');
    const kinds=new Set(items.map(f=>f.jenis_angka));
    if (kinds.size>1) {
      if (items.length!==2 || !same(items,'cakupan') || !kinds.has('Anggaran') || !kinds.has('Realisasi')) fail('visual_scope_mismatch');
    } else if (items[0].jenis_angka==='Realisasi' && !same(items,'tanggal_posisi')) fail('visual_period_mismatch');
    if (new Set(items.map(f=>`${f.cakupan}|${f.jenis_angka}`)).size!==items.length) fail('visual_duplicate_scope');
    // Hindari membandingkan total dengan komponennya. Beberapa cakupan hanya dibolehkan dalam kelompok disjoint yang ditandai data.
    if (!same(items,'cakupan') && (!items.every(f=>f.kelompok) || !same(items,'kelompok'))) fail('visual_total_component');
  }
  return {tipe:spec.tipe,judul:spec.judul || 'Angka anggaran yang tersedia',tujuan:'Ketuk nilai untuk memeriksa sumber; grafik dapat diubah menjadi tabel.',satuan:items[0].satuan,periode:spec.tipe==='garis'?'Perbandingan periode yang tercantum':items.find(f=>f.posisi_data)?.posisi_data ?? `TA ${items[0].tahun_anggaran}`,cakupanBerbeda:!same(items,'cakupan'),items};
}

export function compileAnswer(plan, evidence) {
  if (!plan || !['ok','klarifikasi','tidak_tersedia'].includes(plan.status) || !Array.isArray(plan.paragraf) || plan.paragraf.length<1 || plan.paragraf.length>5) fail('answer_schema');
  const facts=new Map(evidence.facts.map(f=>[f.id,f]));
  const contexts=new Map(evidence.contexts.map(c=>[c.id,c]));
  const cited=new Set(), usedFacts=new Map(), calculations=[];
  const paragraf=plan.paragraf.map(p=>{
    if (typeof p.teks!=='string' || p.teks.length>1800 || !Array.isArray(p.source_ids) || p.source_ids.length>12) fail('paragraph_schema');
    const refs=[...new Set(p.source_ids)];
    for (const id of refs) { if (!facts.has(id) && !contexts.has(id)) fail('source_unknown'); cited.add(id); }
    if (plan.status==='ok' && !refs.length) fail('paragraph_uncited');
    const without=p.teks.replace(/\{\{([^{}]+)\}\}/g,'');
    if (/\p{N}|https?:\/\//u.test(without)) fail('ungrounded_number_or_url');
    const teks=p.teks.replace(/\{\{([^{}]+)\}\}/g,(_,token)=>{
      const split=token.indexOf(':');const type=token.slice(0,split);const value=token.slice(split+1);
      const get=id=>{ if (!refs.includes(id)) fail('placeholder_uncited'); const f=facts.get(id);if (!f) fail('placeholder_unknown');usedFacts.set(id,f);return f; };
      if (type==='persen') {
        const ids=value.split('|');if(ids.length!==2) fail('calculation_ids');
        const [r,a]=ids.map(get);const c=persenRealisasi(r,a);if(!c) fail('calculation_scope');calculations.push(c);return c.teksHasil;
      }
      const f=get(value);
      if(type==='nilai') return formatNilai(f);
      if(type==='tahun') return String(f.tahun_anggaran);
      if(type==='periode') return f.posisi_data ?? `TA ${f.tahun_anggaran}`;
      fail('placeholder_type');
    });
    if (/[{}]/.test(teks)) fail('placeholder_malformed');
    return {teks,source_ids:refs};
  });
  const selected=new Map([...cited].filter(id=>facts.has(id)).map(id=>[id,facts.get(id)]));
  // ID grafik harus sudah dikutip dalam jawaban, bukan sembarang angka pada korpus.
  let visual=null,visual_warning=null;
  if(plan.status==='ok') {
    try { visual=safeVisual(plan.visual,selected); }
    catch(e) { if(!(e instanceof GroundingError)) throw e;visual_warning=e.code; }
  }
  const lanjutan=Array.isArray(plan.lanjutan)?plan.lanjutan.filter(t=>typeof t==='string' && t.length<200 && !/\p{N}|https?:\/\//u.test(t)).slice(0,3):[];
  const sumber=[...cited].map(id=>{
    const item=facts.get(id) ?? contexts.get(id);
    return facts.has(id)?{id,jenis:'dokumen',judul:item.dokumen,fakta:item,url:item.url}:{id,jenis:item.internal?'kamus':'dokumen',judul:item.internal?`Kamus Transkeu.ID: ${item.judul}`:item.dokumen,teks:item.teks,url:item.url ?? null,fakta:item.internal?null:{...item,pos:item.teks,nilai:null}};
  });
  return {status:'ok',status_jawaban:plan.status,ai:true,ringkas:paragraf.map(p=>p.teks).join('\n\n'),paragraf,sumber,angka:[...selected.values()],hitung:calculations[0]??null,kegunaan:[],istilah:[],visual,visual_warning,batasan:plan.status==='tidak_tersedia'?['Data yang tidak dimuat tidak diperkirakan oleh AI.']:[],lanjutan};
}
