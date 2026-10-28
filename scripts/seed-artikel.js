import {readFile} from 'node:fs/promises';
import {Pool} from 'pg';
import {artikel} from '../data/artikel.js';
import {validArticle} from '../server/articles.js';
if(!process.env.DATABASE_URL)throw new Error('Isi DATABASE_URL di server terlebih dahulu.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
const client=await pool.connect();
try {
 await client.query('BEGIN');
 await client.query(await readFile(new URL('../db/artikel.sql',import.meta.url),'utf8'));
 await client.query(await readFile(new URL('../db/bukti-lapangan.sql',import.meta.url),'utf8'));
 for(const a of artikel) {
  if(!validArticle(a))throw new Error('Metadata seed tidak valid: '+a.id);
  // Tidak menimpa status withdrawn/pembaruan editorial yang sudah ada.
  await client.query(`INSERT INTO artikel_pendukung (id,judul,url,penerbit,jenis,penulis,tanggal_terbit,ringkasan,topik,kata_kunci,tahun_anggaran,status,ditinjau_pada,cakupan_tinjauan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING`,[a.id,a.judul,a.url,a.penerbit,a.jenis,JSON.stringify(a.penulis),a.tanggal_terbit,a.ringkasan,a.topik,a.kata_kunci,a.tahun_anggaran,a.status,a.ditinjau_pada,a.cakupan_tinjauan]);
 }
 await client.query('COMMIT');console.log('Tabel artikel dan seed siap. Artikel bukan sumber angka fiskal.');
} catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();await pool.end();}
