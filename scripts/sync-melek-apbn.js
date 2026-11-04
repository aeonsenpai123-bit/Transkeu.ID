import {writeFile,rename} from 'node:fs/promises';
import {collectCatalog} from './lib/melek-catalog.js';
const articles=await collectCatalog('articles');
const carousels=await collectCatalog('carousel');
const snapshot={diakses_pada:new Date().toISOString().slice(0,10),sumber:'https://melekapbn.org/kajian',cakupan:'Seluruh entri berstatus published pada API publik saat sinkronisasi; bukan arsip historis atau konten privat.',jumlah_artikel:articles.length,jumlah_carousel:carousels.length,items:[...articles,...carousels]};
const target=new URL('../data/melek-apbn.json',import.meta.url),temp=new URL('../data/melek-apbn.json.tmp',import.meta.url);
await writeFile(temp,JSON.stringify(snapshot,null,2)+'\n');await rename(temp,target);
console.log(`Indeks publik diperbarui: ${articles.length} artikel, ${carousels.length} carousel. Tidak menyalin isi artikel.`);
