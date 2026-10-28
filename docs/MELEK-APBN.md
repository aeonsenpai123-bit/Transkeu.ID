# Integrasi Melek APBN sebagai bacaan terkait

## Apa yang sudah diterapkan

Jawaban Tanya AI kini mendapat field `bacaan_terkait`. Frontend menampilkannya setelah jawaban/grafik dalam kartu **Bacaan terkait · Melek APBN**. Jalur AI dan Mode Dasar sama-sama bisa mendapat bacaan. Artikel dipilih deterministik dari kata kunci pertanyaan dan konteks pertanyaan lanjutan, bukan tautan yang dikarang LLM.

Sumber primer untuk angka tetap `data/fakta.js`. Sumber sekunder disimpan terpisah pada `artikel_pendukung`; konten artikel tidak dimasukkan ke prompt angka atau grafik. Pengguna membaca analisis melalui tautan asli. Dengan demikian opini dalam artikel tidak berubah menjadi pernyataan resmi pemerintah.

## Contoh alur

Pertanyaan: “Anggaran jalan dipakai untuk apa, dan apa dampaknya?”

1. Retrieval mencari fakta APBN infrastruktur yang tersedia.
2. LLM menjelaskan dengan bahasa sederhana dan rujukan resmi; persentase dihitung kode bila cakupan cocok.
3. Modul artikel mengenali tema jalan/tol/infrastruktur.
4. Jawaban menampilkan bacaan “Mempelajari Dampak Pembangunan Jalan Tol dari Radiator Springs”, dengan atribusi Melek APBN, penulis, dan tanggal 25 September 2026.
5. Kartu diberi penjelasan bahwa bacaan tematik bukan bukti angka untuk tahun anggaran tertentu. Klaim dampak pada artikel tidak dipakai sebagai kesimpulan otomatis tentang realisasi APBN.

Pertanyaan pajak dapat menampilkan carousel tax ratio; pertanyaan energi dapat menampilkan carousel efisiensi energi. Untuk topik kesehatan/pendidikan yang belum memiliki artikel sesuai dalam katalog awal, tidak ada kartu yang dipaksakan muncul.

## Struktur data

| Field | Fungsi |
|---|---|
| id, judul, url | Identitas dan tautan asli; URL unik. |
| penerbit, penulis, jenis | Atribusi dan label analisis/carousel. |
| tanggal_terbit | Tanggal publikasi; null bila belum terkonfirmasi. Bukan tanggal akses. |
| ringkasan | Deskripsi editorial pendek, maksimum 450 karakter. Tidak menyalin artikel lengkap. |
| topik, kata_kunci | Pemetaan ke pajak, pendidikan, kesehatan, subsidi_energi, infrastruktur, perlinsos, umum. |
| tahun_anggaran | Tahun fiskal yang dibahas, bila teridentifikasi; jangan diisi hanya dari tahun publikasi. |
| status | draft / published / withdrawn. Hanya published yang muncul. |
| ditinjau_pada, cakupan_tinjauan | Tanggal pemeriksaan dan apakah pemeriksaan baru mencakup metadata katalog atau isi. |

Tiga metadata awal tersedia dalam `data/artikel.js`. Artikel jalan tol diperiksa halaman artikelnya. Dua carousel diperiksa judul, URL, dan deskripsi pada katalog; tanggal terbit serta penulis belum terkonfirmasi sehingga tidak diisi. Ringkasannya hanya mendeskripsikan tema, bukan menyimpulkan hasil kajian.

## Cara memasang ke database PostgreSQL

1. Gunakan database PostgreSQL milik proyek yang sudah tersedia. Tidak ada database eksternal yang dibuat dalam pekerjaan ini.
2. Tambahkan `DATABASE_URL` sebagai Environment Variable server. Jangan masukkan connection string di frontend atau chat.
3. Jalankan dari folder proyek:

```powershell
npm ci
# Isi DATABASE_URL dalam .env di komputer sendiri.
npm run db:seed-artikel
```

Script menjalankan `db/artikel.sql` dan seed di dalam transaksi. Script memakai parameter SQL dan tidak menimpa data yang sudah ada, termasuk artikel yang statusnya withdrawn.

4. Pada Vercel, isi `DATABASE_URL` untuk Preview, lalu redeploy. Gunakan connection string pooled dari penyedia PostgreSQL sesuai instruksinya. Pertahankan pengaturan TLS penyedia; jangan menonaktifkan verifikasi sertifikat untuk memaksa koneksi.
5. Beri akun aplikasi hak SELECT pada `artikel_pendukung`; pekerjaan kurasi/migrasi memakai akun pengelola terpisah. Browser tidak terhubung langsung ke database.
6. Uji pertanyaan jalan tol, pajak, dan energi. Saat `DATABASE_URL` kosong, prototipe memakai katalog lokal yang sama. Saat URL diisi tetapi database bermasalah, kartu bacaan disembunyikan dan jawaban APBN tetap berjalan.

Migrasi/schema dan adapter telah disiapkan; koneksi dan migrasi pada database nyata belum dijalankan karena kredensial proyek tidak tersedia.

## Menambah atau memperbarui artikel

Versi ini menggunakan **kurasi metadata**, bukan sinkronisasi otomatis seluruh situs.

1. Temukan artikel/carousel publik dari https://melekapbn.org/kajian.
2. Buka tautan spesifik. Catat judul, penerbit, penulis, tanggal bila tersedia, jenis dan topik. Jangan mengisi tanggal yang tidak tampil.
3. Tulis deskripsi singkat dengan kata sendiri. Simpan tautan, bukan salinan artikel lengkap atau gambar carousel.
4. Masukkan sebagai draft, periksa konteks dan keterkaitan dengan pertanyaan APBN, kemudian ubah menjadi published.
5. Untuk konten yang ditarik, tautan berubah, atau tidak relevan lagi, ubah menjadi withdrawn atau perbarui metadatanya.
6. Jika kelak Melek APBN menyediakan API/RSS yang disepakati, buat sinkronisasi terjadwal yang memasukkan hasil baru ke draft untuk ditinjau. Belum ada API/RSS resmi yang terverifikasi dalam pekerjaan ini; jangan membuat endpoint WordPress/RSS berdasarkan tebakan.

Tidak ada pengambilan semua halaman, penyimpanan artikel lengkap, penyalinan gambar, atau kemitraan resmi dengan Melek APBN yang diklaim pada implementasi ini.

## Pengujian

`npm test`: 40 pengujian lolos, termasuk relevansi topik, tanggal belum diketahui, tahun fiskal berbeda, penolakan URL tidak sah, deduplikasi, penolakan sumber sekunder sebagai fakta angka, fallback bila DB gagal, query adapter berparameter, dan render kartu tanpa mengeksekusi HTML.

Pengujian database memakai adapter simulasi; belum menjalankan PostgreSQL nyata. Pengujian provider LLM masih simulasi. Kualitas kecocokan berita perlu dievaluasi pada kumpulan pertanyaan pengguna; pencocokan kata kunci bukan pencarian semantik penuh.
