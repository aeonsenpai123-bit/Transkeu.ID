# Alur bukti dan aspirasi

Perubahan ini menghubungkan jawaban → sumber → Jejak Anggaran → draf aspirasi pada prototipe APBN pusat.

## Cara mencoba

1. Tanyakan anggaran pendidikan 2026, lalu lanjutkan “Sudah berapa persen?”. Riwayat topik dipakai juga ketika layanan berjalan dalam Mode Dasar.
2. Buka Kartu Sumber. Jika metadata menyebut halaman PDF, tautan menambahkan `#page=N`. Beberapa pembaca PDF seluler dapat mengabaikan fragmen ini; halaman dan kutipan tetap terlihat di kartu.
3. Pilih “Telusuri program terkait”. Pada PIP, KIP Kuliah, BOS, infrastruktur jalan dan subsidi energi, cakupan pagu lebih luas dari realisasi satu program. UI tidak menghitung rasio program dari pasangan tersebut. Capaian subsidi energi 2025 diberi label terpisah dari belanja 2026.
4. Pilih “Susun aspirasi dari bukti ini” atau “Susun aspirasi dengan sumber program”. Formulir membawa angka, jenis, tahun, cakupan, dokumen, halaman, kutipan, serta tautan. Lengkapi masalah dan usulan sebelum menyalin draf. Tidak ada pengiriman ke pihak lain secara otomatis.
5. Jika sumber belum lengkap, sumber tersebut tidak dimasukkan ke draf. Tanpa bukti terpilih, draf menyatakan bahwa dokumen pendukung belum dipilih.

## Verifikasi

`npm test`: 116 tes, termasuk integrasi DOM jawaban → sumber → formulir → draf, penolakan rasio lintas cakupan, penandaan output tahun berbeda, dan konteks percakapan.

`npm run audit:data`: 32 fakta memenuhi struktur metadata. Audit ini bukan pemeriksaan ulang kebenaran setiap angka dalam PDF.

Tes LLM menggunakan respons tiruan; sukses tes tidak membuktikan penyedia model menerima API key atau kuota deployment. Indikator AI/Mode Dasar tetap ditampilkan sesuai respons server. Pengujian model nyata memerlukan konfigurasi penyedia yang valid.

## Batas data

Tidak ada angka fiskal baru atau hasil evaluasi dampak yang dibuat pada perubahan ini. Katalog hasil/dampak tetap hanya menampilkan bukti yang telah dimuat dan lolos validasi. Data kosong tidak berarti program tidak berdampak. Artikel Melek APBN tetap merupakan konteks sekunder, bukan sumber angka resmi atau grafik.
