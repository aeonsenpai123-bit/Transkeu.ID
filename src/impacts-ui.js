export function renderImpacts(result,{el}) {
  if(!result)return null;
  const labels={output:'Hasil langsung program',outcome:'Perubahan yang diamati',dampak:'Dampak berdasarkan evaluasi',temuan_pelaksanaan:'Temuan pelaksanaan'};
  return el('section',{class:'hasil-lapangan','aria-label':'Hasil dan dampak di lapangan'},
    el('h3',{},'Hasil dan dampak di lapangan'),
    el('p',{},result.pesan),
    (result.bukti??[]).map(r=>el('article',{class:'kartu-bacaan'},
      el('span',{class:'lencana'},`${labels[r.tingkat]??r.tingkat} · ${r.arah}`),
      el('h4',{},r.indikator),el('p',{},r.temuan),
      el('p',{class:'catatan-kecil'},`${r.wilayah} · TA ${r.tahun_anggaran} · ${r.periode}`),
      el('p',{class:'catatan-kecil'},`Pendanaan: ${r.sumber_pendanaan==='campuran'?'APBN bersama sumber lain':'APBN'}. Dasar: ${r.dasar_pendanaan}`),
      el('p',{class:'catatan-kecil'},`Dasar kesimpulan: ${r.hubungan}. Metode: ${r.metode}`),
      el('p',{class:'catatan-kecil'},`Batas temuan: ${r.keterbatasan}`),
      r.sumber.map(s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&!u.username&&!u.password?el('a',{href:s.url,target:'_blank',rel:'noopener noreferrer'},`Periksa bukti: ${s.dokumen} (${s.halaman})`):null;}catch{return null;}})
    )),
    el('p',{class:'catatan-kecil'},'Belanja terserap belum otomatis berarti program berhasil. Pembayaran pajak individu tidak ditelusuri langsung ke satu proyek.')
  );
}
