export function renderArticles(rows,{el}) {
  if(!Array.isArray(rows)||!rows.length)return null;
  const safe=rows.filter(a=>{try{const u=new URL(a.url);return u.protocol==='https:'&&u.hostname==='melekapbn.org'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&/^\/(articles|carousel)\/.+/.test(u.pathname);}catch{return false;}}).slice(0,3);
  if(!safe.length)return null;
  return el('section', {class:'bacaan-terkait','aria-label':'Bacaan terkait dari Melek APBN'},
    el('h3',{},'Bacaan terkait · Melek APBN'),
    el('p',{class:'catatan-kecil'},'Analisis dan edukasi tambahan. Angka serta grafik jawaban tetap merujuk dokumen resmi.'),
    safe.map(a=>el('article',{class:'kartu-bacaan'},
      el('span',{class:'lencana'},a.jenis==='carousel'?'Carousel edukasi':'Artikel analisis'),
      el('h4',{},el('a',{href:a.url,target:'_blank',rel:'noopener noreferrer'},a.judul)),
      el('p',{},a.ringkasan),
      el('p',{class:'catatan-kecil'},`${a.penerbit} · ${a.tanggal_terbit??'Tanggal terbit belum terkonfirmasi'}${a.penulis?.length?' · '+a.penulis.join(', '):''}`),
      el('p',{class:'catatan-kecil'},`Tautan diperiksa: ${a.ditinjau_pada}. ${a.tahun_anggaran?.length?'Tahun anggaran terkait: '+a.tahun_anggaran.join(', '):'Bacaan tematik; bukan bukti angka untuk tahun anggaran tertentu.'}`)
    ))
  );
}
