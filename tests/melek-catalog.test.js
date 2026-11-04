import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {artikel,katalogMelek} from '../data/artikel.js';
import {relatedArticles,validArticle,loadArticles} from '../server/articles.js';
import {publicMetadata,collectCatalog} from '../scripts/lib/melek-catalog.js';
import {handleQuestion} from '../server/handler.js';
import {renderClaimCheck} from '../src/claim-check-ui.js';
const now=new Date('2026-11-04T12:00:00Z');
test('snapshot mencakup seluruh 5 artikel dan 8 carousel publik',()=>{
 assert.equal(artikel.length,13);assert.equal(katalogMelek.jumlah_artikel,5);assert.equal(katalogMelek.jumlah_carousel,8);
 assert.equal(new Set(artikel.map(a=>a.url)).size,13);assert.ok(artikel.every(a=>validArticle(a,now)));
 const patriot=artikel.find(a=>a.judul==='Patriotisme Berkupon 2%');assert.ok(patriot.url.includes('/articles/@universitas-indonesia/'));assert.equal(patriot.penulis.length,2);
});
test('pencarian artikel mencakup karhutla, UMKM, MBG, Dana Desa dan nikel',()=>{
 for(const [q,word] of [['karhutla 2026','Kabut'],['ekonomi bayangan 2027','Bayangan'],['MBG 2027','Pertumbuhan'],['Dana Desa 2026','Desa'],['hilirisasi nikel','Nikel']]) {
  const results=relatedArticles(q,[],artikel,{now});assert.ok(results.some(a=>a.judul.includes(word)),q);
 }
 assert.equal(relatedArticles('Dana Desa 2025',[],artikel,{now}).filter(a=>a.judul.includes('Desa')).length,0);
});
test('normalisasi hanya menyimpan metadata publik, tanpa isi/gambar/identitas editor',()=>{
 const r=publicMetadata({id:'public',title:'Judul',slug:'@kampus/judul',status:'published',content:'JANGAN DISIMPAN',created_by:'PRIVATE',cover_url:'IMAGE',authors:[{name:'Penulis'}]},'articles',now);
 assert.deepEqual(r.penulis,['Penulis']);assert.equal(r.tanggal_terbit,null);assert.ok(!JSON.stringify(r).includes('JANGAN'));assert.ok(!JSON.stringify(r).includes('PRIVATE'));assert.ok(!JSON.stringify(r).includes('IMAGE'));
 assert.equal(publicMetadata({status:'draft'},'articles',now),null);assert.equal(publicMetadata({status:'published',is_deleted:true},'articles',now),null);
 assert.throws(()=>publicMetadata({id:'x',title:'X',slug:'../secret',status:'published'},'articles',now));
});
const page=(p,rows,total,next)=>({ok:true,json:async()=>({success:true,data:{data:rows,pagination:{page:p,total,hasNext:next}}})});
const row=id=>({id,title:id,slug:id,status:'published'});
test('sinkronisasi mengikuti pagination dan menolak hasil parsial atau duplikat',async()=>{
 const urls=[];const r=await collectCatalog('articles',{fetchImpl:async u=>{urls.push(u);return urls.length===1?page(1,[row('a')],2,true):page(2,[row('b')],2,false);}});assert.equal(r.length,2);assert.ok(urls[1].includes('page=2'));
 await assert.rejects(collectCatalog('articles',{fetchImpl:async()=>page(1,[row('a')],2,false)}),/tidak lengkap/);
 await assert.rejects(collectCatalog('articles',{maxPages:1,fetchImpl:async()=>page(1,[row('a')],2,true)}),/Batas/);
 let n=0;await assert.rejects(collectCatalog('articles',{fetchImpl:async()=>page(++n,[row('a')],2,n===1)}),/duplikat/);
});
test('withdrawn di database menekan artikel snapshot dengan ID yang sama',async()=>{
 const hidden=artikel[0];const r=await loadArticles({env:{},db:{query:async()=>({rows:[{...hidden,status:'withdrawn'}]})}});assert.ok(!r.some(a=>a.id===hidden.id));assert.equal(r.length,artikel.length-1);
});
test('pertanyaan dampak memberi konteks sekunder tanpa vonis dan tidak memasukkan artikel ke angka',async()=>{
 const {body}=await handleQuestion({pertanyaan:'Benar jalan tol berdampak negatif pada ekonomi sekitar?'},{env:{},logger:{warn(){}}});
 assert.equal(body.pemeriksaan_klaim.status,'belum_disimpulkan');assert.ok(body.bacaan_terkait.some(a=>a.id==='melek-jalan-tol'));
 assert.ok(!body.angka?.some(a=>a.penerbit==='Melek APBN'));assert.ok(!body.sumber?.some(a=>a.id==='melek-jalan-tol'));
});
test('panel pemeriksaan menggunakan teks aman dan mengakui bukti yang belum tersedia',()=>{
 const {document}=parseHTML('<html></html>');const el=(tag,attrs={},...children)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);for(const c of children.flat(Infinity))if(c!=null)e.append(c);return e;};
 const ui=renderClaimCheck({status:'belum_disimpulkan',pesan:'<script>tidak dijalankan</script>',langkah:['Periksa sumber'],bukti_lapangan:'belum_tersedia'},{el});assert.equal(ui.querySelector('script'),null);assert.ok(ui.textContent.includes('bukan bukti bahwa program gagal'));
});
