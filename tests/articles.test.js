import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {artikel} from '../data/artikel.js';
import {relatedArticles,validArticle,attachArticles,loadArticles} from '../server/articles.js';
import {factEligible} from '../server/retrieval.js';
import {renderArticles} from '../src/articles-ui.js';
import {handleQuestion} from '../server/handler.js';
const now=new Date('2026-10-28T12:00:00Z');
test('jalan tol mengarah ke bacaan infrastruktur, bukan pajak',()=>{
 const r=relatedArticles('Apa dampak pembangunan jalan tol?',[],artikel,{now});assert.equal(r.length,1);assert.equal(r[0].id,'melek-jalan-tol');
});
test('pertanyaan pajak mengarah ke tax ratio',()=>assert.equal(relatedArticles('Penerimaan pajak itu apa?',[],artikel,{now})[0].id,'melek-tax-ratio'));
test('kesehatan tidak dipaksa mendapat artikel tidak relevan',()=>assert.equal(relatedArticles('Berapa anggaran kesehatan?',[],artikel,{now}).length,0));
test('tanggal terbit tidak diketahui tetap null, bukan tanggal akses',()=>assert.equal(relatedArticles('Jelaskan subsidi energi',[],artikel,{now})[0].tanggal_terbit,null));
test('draft, withdrawn, masa depan, tanggal palsu dan domain lain tidak ditampilkan',()=>{
 for(const changed of [{status:'draft'},{status:'withdrawn'},{tanggal_terbit:'2026-12-01'},{tanggal_terbit:'2026-02-31'},{url:'https://melekapbn.org.evil.invalid/articles/x'},{url:'javascript:alert(1)'},{url:'https://user:password@melekapbn.org/articles/x'}])assert.equal(validArticle({...artikel[0],...changed},now),false);
});
test('artikel bertahun fiskal berbeda tidak dianggap terkait tahun pertanyaan',()=>{
 const rows=[{...artikel[0],tahun_anggaran:[2027]}];assert.equal(relatedArticles('Jalan tol APBN 2026',[],rows,{now}).length,0);
});
test('URL yang sama tidak ditampilkan dua kali',()=>assert.equal(relatedArticles('jalan tol',[],[artikel[0],{...artikel[0],id:'duplikat',url:artikel[0].url+'?ref=link'}],{now}).length,1));
test('artikel sekunder tidak lolos sebagai fakta angka resmi',()=>assert.equal(factEligible({...artikel[0],nilai:999,satuan:'Rp triliun',pos:'Anggaran',tahun_anggaran:2026,cakupan:'x',jenis_angka:'Anggaran',dokumen:'x',kutipan:'999',halaman_atau_tabel:'1'}),false));
test('kegagalan DB tidak merusak jawaban fiskal dan tidak menghidupkan artikel withdrawn dari cache lokal',async()=>{
 const r=await attachArticles({status:'ok',ringkas:'Jawaban asli'},'jalan tol',[],{load:async()=>{throw new Error('db error secret');},logger:{warn(){}}});assert.equal(r.ringkas,'Jawaban asli');assert.deepEqual(r.bacaan_terkait,[]);
});
test('adapter DB memakai parameter status dan tidak menyisipkan pertanyaan',async()=>{
 let text,values;const r=await loadArticles({env:{},db:{query:async(t,v)=>{text=t;values=v;return {rows:artikel};}}});assert.ok(text.includes('status = $1'));assert.deepEqual(values,['published',300]);assert.equal(r.length,3);
});
test('endpoint Mode Dasar tetap memberi bacaan terkait',async()=>{
 const r=await handleQuestion({pertanyaan:'Subsidi energi dipakai buat apa?'},{env:{},logger:{warn(){}}});assert.equal(r.body.ai,false);assert.equal(r.body.bacaan_terkait[0].id,'melek-efisiensi-energi');
});
test('kartu UI menampilkan atribusi, ketidakpastian tanggal, tautan aman dan tidak menafsirkan HTML',()=>{
 const {document}=parseHTML('<html><body></body></html>');
 const el=(tag,attrs={},...children)=>{const e=document.createElement(tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);for(const c of children.flat(Infinity))if(c!=null)e.append(c);return e;};
 const rows=[{...artikel[1],judul:'<img src=x onerror=alert(1)>'}];
 const ui=renderArticles(rows,{el});assert.ok(ui.textContent.includes('Tanggal terbit belum terkonfirmasi'));assert.ok(ui.textContent.includes('Melek APBN'));assert.equal(ui.querySelector('img'),null);assert.equal(ui.querySelector('a').getAttribute('rel'),'noopener noreferrer');
 assert.equal(renderArticles([{...artikel[0],url:'https://evil.invalid/articles/x'}],{el}),null);
});
