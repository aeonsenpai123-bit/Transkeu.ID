# Hasil dan dampak penggunaan APBN

## Arah produk

Transkeu.ID membantu warga memeriksa hubungan antara dana yang dianggarkan, realisasi, hasil program, perubahan yang dirasakan, serta masalah pelaksanaan. Temuan positif, negatif, campuran, atau tidak terdeteksi disajikan sesuai bukti; tidak wajib membuat daftar positif dan negatif bila sumber hanya mendukung salah satunya.

Alur: **Alokasi → Realisasi → Output → Outcome → Dampak (bila tersedia evaluasi)**.

| Tahap | Yang diperiksa | Bukti yang diperlukan |
|---|---|---|
| Alokasi | Dana yang direncanakan untuk program tertentu | Dokumen APBN/pagu program; jangan menyamakan paket beasiswa dengan satu program. |
| Realisasi | Dana yang telah disalurkan/dibelanjakan sampai tanggal tertentu | Laporan realisasi pada cakupan yang sama. |
| Output | Layanan/barang/penerima yang dihasilkan | Laporan capaian program. Jumlah penerima bukan otomatis bukti perubahan kesejahteraan. |
| Outcome | Perubahan akses, biaya, perilaku atau kondisi penerima | Statistik, survei representatif, laporan evaluasi; cakupan dan metode dicantumkan. |
| Dampak | Perubahan yang dapat dikaitkan secara kausal dengan program | Evaluasi dengan rancangan pembanding/identifikasi yang dapat dipertanggungjawabkan. |
| Masalah pelaksanaan | Keterlambatan, ketidaktepatan sasaran, kualitas layanan | Hasil audit/pemeriksaan/evaluasi; bukan otomatis bukti efek jangka panjang. |

Contoh ilustratif, bukan temuan faktual: program bantuan pendidikan bisa diperiksa dari jumlah penerima (output), perubahan kelanjutan sekolah (outcome), dan bukti evaluasi mengenai kontribusi bantuannya. Dugaan keterlambatan penyaluran harus diperiksa pada sumber, wilayah, dan periode yang tepat. Tidak ada angka dampak ilustratif yang dimasukkan ke katalog production.

## Yang sudah ditambahkan ke kode

- Bagian **4. Hasil dan dampak di lapangan** pada kartu Jejak Anggaran, dengan tombol meminta bukti program tersebut.
- API dapat menerima `konteks_lapangan` berisi `program_id`, `tahun_anggaran`, dan `wilayah_kode`.
- Tampilan hasil memisahkan temuan, wilayah, periode, indikator, metode, jenis hubungan, keterbatasan, pendanaan, serta rujukan sumber.
- Pencarian bukti mencocokkan program dan tahun. Bila wilayah dipilih, hanya wilayah itu yang dipakai. Tanpa wilayah, hanya bukti nasional yang ditampilkan dan tidak dianggap lokal.
- Nama sektor tidak otomatis dianggap nama program. Pertanyaan “pendidikan” perlu diperjelas menjadi PIP, KIP Kuliah, BOS, atau program lainnya.
- Angka output tidak otomatis dipromosikan menjadi dampak. Artikel Melek APBN adalah konteks bacaan, bukan pengganti evaluasi primer.
- Tujuan program pada materi umum tidak diklaim sebagai perubahan yang sudah terjadi.

## Status data

`data/bukti-lapangan.js` sengaja **belum berisi temuan nyata**. Tidak ada dokumen evaluasi dampak per program/wilayah yang telah dikurasi ke katalog pada pekerjaan ini. Jika kosong, pengguna melihat: “Bukti hasil atau dampak terverifikasi untuk program, tahun, dan wilayah ini belum dimuat. Ini tidak berarti program tidak berdampak.”

Ini implementasi struktur dan alur bukti, bukan bukti bahwa seluruh program sudah memiliki evaluasi dampak. Model tidak diberi kebebasan mengisi kekosongan dengan cerita keberhasilan atau kegagalan.

## Database

`db/bukti-lapangan.sql` membuat tabel bukti terpisah. Jalankan migrasi melalui `npm run db:seed-artikel`; script kini membuat tabel artikel dan bukti lapangan, tetapi tidak memasukkan temuan dampak karangan.

Payload terkurasi memuat:

- Identitas: id, program_id, tahun_anggaran, wilayah_kode, wilayah, periode.
- Pendanaan: sumber_pendanaan (`APBN` / `campuran`) dan dasar_pendanaan. Program APBD murni tidak dilabel hasil APBN. Program campuran tidak seluruh hasilnya diatribusikan pada APBN.
- Pengukuran: tingkat (`output`, `outcome`, `dampak`, `temuan_pelaksanaan`), indikator, temuan, arah, hubungan (`deskriptif`, `asosiasi`, `kausal`), metode, keterbatasan.
- Dampak kausal memerlukan pembanding, asumsi_identifikasi, serta sumber jenis evaluasi.
- Sumber: dokumen, penerbit, URL HTTPS, halaman/tabel, kutipan, jenis sumber (`evaluasi`, `audit`, `statistik`, `laporan_program`). Analisis/berita saja tidak cukup untuk mempublikasikan bukti evaluasi.
- Kurasi: status (`draft` / `published` / `withdrawn`), ditinjau_pada. Hanya published dan lolos validasi yang ditampilkan.

Simpan satu baris per temuan; temuan positif dan masalah pada program yang sama dapat memiliki wilayah/periode dan metode yang berlainan. Pertahankan perbedaannya.

Validasi metadata/metode tidak menjamin studi berkualitas. Peninjau tetap harus membaca dokumen, memeriksa indikator, pendanaan, sampel, dan batas generalisasi sebelum status published diberikan.

## Tahap pengisian data berikutnya

1. Pilih satu program pilot yang relevan bagi mahasiswa/pekerja muda.
2. Cari bukti pendanaan dan realisasi program, bukan hanya pagu sektor/paket program.
3. Tambahkan laporan output dan sumber evaluasi/audit/statistik yang sesuai program, tahun dan wilayah.
4. Catat temuan apa adanya. Jangan menyamakan kondisi sesudah program dengan akibat program tanpa dasar identifikasi.
5. Tinjau lalu publikasikan temuan. Jika bukti lokal belum ada, tampilkan nasional sebagai nasional, bukan fakta di sekitar pengguna.
6. Tambahkan pemilih wilayah dari wilayah yang benar-benar memiliki bukti. Pemilih wilayah untuk pengguna belum dibuat dalam paket ini; konteks wilayah saat ini tersedia pada kontrak API, sementara tombol Jejak memakai cakupan nasional.

Pembayaran pajak seseorang tidak ditelusuri langsung ke satu sekolah/jalan dari data agregat APBN. Kaitan yang ditampilkan adalah kontribusi perpajakan pada pembiayaan negara dan program yang dibiayainya.

## Acuan metode

- World Bank DIME: https://www.worldbank.org/en/about/unit/unit-dec/impactevaluation/about
- BPK, laporan pemeriksaan publik: https://www.bpk.go.id/ihps/index/

Tidak ada koneksi/migrasi database nyata, evaluasi lapangan baru, atau perubahan production yang dilakukan. Tes sintetis hanya menguji aturan pemilihan dan penolakan bukti.
