export function renderClaimCheck(check,{el}) {
 if(!check||check.status!=='belum_disimpulkan')return null;
 return el('section',{class:'bacaan-terkait','aria-label':'Pemeriksaan klaim dan dampak'},
  el('h3',{},'Cara memeriksa klaim dan dampak'),
  el('p',{},check.pesan),
  el('ol',{},(check.langkah??[]).slice(0,4).map(t=>el('li',{},t))),
  el('p',{class:'catatan-kecil'},check.bukti_lapangan==='tersedia'?'Bukti lapangan tersedia di bagian hasil program; periksa cakupan dan keterbatasannya.':'Bukti dampak terverifikasi belum dimuat untuk konteks ini. Ketiadaan bukti di platform bukan bukti bahwa program gagal atau berhasil.')
 );
}
