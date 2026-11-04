import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { hasilInstansi } from '../src/instansi.js';
test('beranda filter instansi, rincian, sumber dan pertanyaan terhubung',async()=>{
 const {document,window}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));
 Object.assign(globalThis,{document,window,ResizeObserver:class{observe(){}},localStorage:{getItem(){return null},setItem(){}}});
 window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','')};window.HTMLElement.prototype.close=function(){this.removeAttribute('open')};window.scrollTo=()=>{};
 globalThis.fetch=async(url,opts)=>({ok:true,json:async()=>hasilInstansi(JSON.parse(opts.body).pertanyaan)});
 await import('../src/app.js');
 const section=document.getElementById('belanja-instansi');assert.ok(section);assert.equal(section.querySelectorAll('details').length,10);
 const select=section.querySelector('select');select.querySelector('[value="semua"]').removeAttribute('selected');select.querySelector('[value="kementerian"]').setAttribute('selected','');select.dispatchEvent(new window.Event('change'));
 assert.equal(section.querySelectorAll('details').length,8);assert.match(section.querySelector('summary').textContent,/Pertahanan/);
 const source=[...section.querySelectorAll('button')].find(b=>b.textContent==='Periksa pagu dan program');source.click();
 assert.ok(document.getElementById('sheet').hasAttribute('open'));assert.match(document.getElementById('sheet-badan').textContent,/BA 012/);
 document.getElementById('input-tanya').value='Instansi dengan anggaran terbesar 2026?';document.getElementById('form-tanya').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,20));
 assert.match(document.getElementById('obrolan').textContent,/Badan Gizi Nasional/);
});
