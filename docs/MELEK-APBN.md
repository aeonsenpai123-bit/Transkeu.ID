# Melek APBN: indeks bacaan dan pemeriksaan klaim

## Isi yang terhubung

Snapshot katalog publik per 4 November 2026 memuat **5 artikel dan 8 carousel** dari halaman https://melekapbn.org/kajian. Jumlah mengikuti pagination API publik, bukan perkiraan dari mesin pencarian. Cakupan ini adalah seluruh entri berstatus published yang dikembalikan API pada saat akses, bukan arsip artikel yang sudah ditarik atau konten privat.

`data/melek-apbn.json` menyimpan judul, URL asli, penulis, tanggal terbit bila tersedia, kategori, dan tag. Tidak menyimpan isi lengkap, gambar, identitas editor, token atau data akun. Slug berorganisasi seperti `/articles/@universitas-indonesia/...` dipertahankan; tautan lama yang berbeda diganti dengan URL pada katalog saat ini. `data/artikel.js` menambahkan ringkasan editorial singkat dan kata kunci pencarian. Artikel baru yang belum dikurasi hanya memakai deskripsi tematik, tanpa kesimpulan dampak otomatis.

Tanya AI dan Mode Dasar mencari bacaan pada indeks yang sama. Contoh: jalan tol, karhutla, MBG, ekonomi bayangan, Dana Desa, hilirisasi nikel, Patriot Bond, tax ratio, efisiensi energi, dan pelaporan pajak. Hasil dibatasi pada bacaan relevan; tidak memaksakan artikel untuk tema yang belum tersedia. Tahun anggaran dikurasi terpisah dari tahun terbit. Bacaan umum tanpa tahun anggaran diberi keterangan bahwa bacaan tersebut bukan bukti realisasi untuk satu tahun.

## Apa yang dimaksud validasi

Pertanyaan tentang kebenaran berita, manfaat atau dampak memperoleh bagian **Cara memeriksa klaim dan dampak**. Bagian ini menjelaskan pemeriksaan program, tahun, wilayah, sumber pendanaan, jenis angka, evaluasi primer dan batasan kesimpulan. Ringkasan bacaan menyebut peluang serta risiko yang dibahas sumber; keduanya bukan hasil audit Transkeu.ID.

Tiga lapisan sumber tetap terpisah:

1. Fakta APBN resmi mendasari angka dan grafik.
2. Artikel Melek APBN memberi konteks analisis sekunder dengan tautan dan atribusi.
3. Bukti hasil/dampak pada `bukti_lapangan` memerlukan evaluasi, audit, statistik, atau laporan program yang lolos pemeriksaan. Dampak kausal memerlukan pembanding dan asumsi identifikasi.

Pencocokan topik bukan putusan benar/salah. Penyerapan anggaran bukan bukti keberhasilan. Dana BUMN atau swasta bukan otomatis belanja APBN. Kajian daerah tertentu tidak digeneralisasi ke seluruh Indonesia. Jika bukti primer belum dimuat, platform menyatakan keterbatasannya. Tidak ada klaim bahwa seluruh referensi di artikel sudah diaudit, bahwa ada kemitraan resmi, atau bahwa isi artikel lengkap dimasukkan ke prompt LLM. Jawaban naratif AI tetap menggunakan evidence resmi; ringkasan artikel ditampilkan terpisah.

## Memperbarui seluruh katalog

```bash
npm run sync:melek
npm test
```

Script mengambil endpoint GET publik `/api/articles` dan `/api/carousel` pada `api.melekapbn.org`, masing-masing dengan pagination. Tanpa login atau API key. Hanya metadata yang diizinkan dipersistenkan. Draft, konten dihapus dan publikasi masa depan diabaikan. Schema berubah, error HTTP, ID duplikat, jumlah tidak cocok atau batas halaman terlampaui akan membatalkan sinkronisasi. File lama dipertahankan hingga kedua koleksi berhasil lengkap. Script tidak mengunjungi endpoint admin.

Tinjau perubahan metadata dan ringkasan, commit, lalu deploy. Pembaruan ini **tidak otomatis setiap pertanyaan atau terjadwal**; label tanggal adalah tanggal pengambilan katalog, bukan jaminan pemeriksaan isi penuh. Artikel yang sudah dihapus akan hilang dari snapshot berikutnya. Semua 13 bacaan tersedia tanpa database tambahan.

## Database opsional

`npm run db:seed-artikel` membuat tabel dan memasukkan metadata. Loader menggabungkan snapshot dengan data editorial database. Entri database dengan ID sama mengambil prioritas, termasuk status withdrawn/draft yang menekan versi snapshot. Gangguan database menyembunyikan bacaan daripada menghidupkan kembali bacaan yang mungkin sudah ditarik. Batas baca database 10.000 entri; instalasi yang melebihi batas memerlukan pagination database.

Sumber pendukung tidak mengubah tabel fakta atau perhitungan APBN. Jangan memasukkan nilai anggaran, klaim dampak positif/negatif, atau penilaian berita ke tabel fakta hanya karena muncul dalam artikel.
