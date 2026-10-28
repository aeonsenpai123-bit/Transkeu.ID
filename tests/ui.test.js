import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { corpus } from '../server/retrieval.js';
import { compileAnswer } from '../server/grounding.js';

test('alur Tanya AI merender narasi, sumber per paragraf, grafik/tabel dan pembukaan sumber',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const {document,window}=parseHTML(html);globalThis.document=document;globalThis.window=window;
 globalThis.ResizeObserver=class{observe(){}};
 globalThis.localStorage={getItem(){return null;},setItem(){}};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};
 window.scrollTo=()=>{};
 const a=corpus.fakta.find(f=>f.id==='pendidikan-2026-anggaran');const r=corpus.fakta.find(f=>f.id==='pendidikan-2026-realisasi-sep');
 const plan={status:'ok',paragraf:[{teks:`Gampangnya, rencana pendidikan adalah {{nilai:${a.id}}}. Yang sudah dipakai {{periode:${r.id}}} sebesar {{nilai:${r.id}}}.`,source_ids:[a.id,r.id]},{teks:'Angka penyerapan belum otomatis membuktikan hasil pendidikan.',source_ids:[a.id]}],visual:{tipe:'batang',judul:'Rencana dan realisasi pendidikan',fakta_ids:[a.id,r.id]},lanjutan:['Apa bedanya anggaran dan realisasi?']};
 const response=compileAnswer(plan,{facts:[a,r],contexts:[]});
 globalThis.fetch=async()=>({ok:true,json:async()=>response});
 await import('../src/app.js');
 document.getElementById('input-tanya').value='Duit sekolah sudah kepakai berapa?';
 document.getElementById('form-tanya').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 // Tunggu satu giliran event loop agar fetch dan render selesai.
 await new Promise(resolve=>setImmediate(resolve));
 const card=document.querySelector('#obrolan .jawaban');assert.ok(card);
 assert.equal(card.querySelectorAll('.paragraf-ai').length,2);
 assert.equal(card.querySelectorAll('.sumber-paragraf').length,3);
 assert.ok(card.textContent.includes('AI · angka dari tabel fakta'));
 assert.ok(card.querySelector('.grafik-batang-list'));
 const toggle=card.querySelector('.tombol-visual-tab');toggle.click();assert.equal(toggle.textContent,'Tampilkan grafik');assert.equal(card.querySelector('.visual-badan-tabel').hidden,false);
 card.querySelector('.sumber-paragraf').click();assert.ok(document.getElementById('sheet').hasAttribute('open'));assert.ok(document.getElementById('sheet-badan').textContent.includes(a.dokumen));
 assert.ok(!card.textContent.includes('{{'));
});

test('grafik fallback tidak menggambar rasio untuk unit atau cakupan campuran',async()=>{
 const {document}=parseHTML('<html><body></body></html>');globalThis.document=document;
 const {renderVisual}=await import('../src/visual.js');
 const el=(tag,attrs={},...children)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='onclick')e.addEventListener('click',v);else if(v!=null)e.setAttribute(k,v);}for(const c of children.flat(Infinity))if(c!=null)e.append(c);return e;};
 const a=corpus.fakta.find(f=>f.id==='pendidikan-2026-anggaran');const r=corpus.fakta.find(f=>f.id==='kesehatan-2026-realisasi-sep');
 const dom=renderVisual({tipe:'batang',satuan:'Rp triliun',items:[a,r]},{el,onBukaSumber(){}});
 assert.equal(dom.querySelector('.grafik-batang-list'),null);assert.ok(dom.querySelector('table'));assert.ok(dom.textContent.includes('belum sebanding'));
});
