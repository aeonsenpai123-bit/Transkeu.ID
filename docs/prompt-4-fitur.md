# Prompt: tambahkan empat fitur inti ke prototipe Transkeu.ID

Salin seluruh isi di bawah garis ke agen koding (Claude Code, Antigravity, dll.) yang membuka folder `transkeu-id`.

---

Kamu melanjutkan prototipe **Transkeu.ID**, situs ramah ponsel untuk meningkatkan literasi fiskal: warga bertanya tentang APBN pemerintah pusat dan melihat ke mana uang rakyat dipakai, dengan setiap angka bisa ditelusuri ke dokumen resmi. Ini proyek mahasiswa Akuntansi Sektor Publik UNJ, bukan situs resmi pemerintah.

## Baca dulu sebelum menulis kode

1. `CLAUDE.md` (aturan produk yang tidak boleh dilanggar) dan `docs/PRD.md`.
2. `README.md` (cara menjalankan, alur AI).
3. Kode yang sudah ada dan wajib dipakai ulang, bukan ditulis ulang:
   - `data/fakta.js`: tabel fakta (satu baris per angka: dokumen, penerbit, halaman, kutipan, URL). Satu-satunya sumber angka.
   - `src/hitung.js`: `formatNilai`, `persenRealisasi` (satu-satunya tempat perhitungan; hanya menghitung bila tahun, cakupan pos, dan satuan sama).
   - `src/mesin.js`: mesin jawab berbasis aturan (cadangan saat AI mati), `PESAN_TIDAK_TERSEDIA`, `PORTAL_RESMI`.
   - `src/ai.js` + `src/penjaga.js`: Claude memilih id baris dan menulis penjelasan dengan placeholder `{{id}}`; penjaga mengisi angka dan menolak jawaban yang memuat angka lain.
   - `src/app.js`: komponen kartu sumber (bottom sheet), penanda istilah, kartu jawaban, umpan balik, kuis.
   - `docs/design-system.md` + `src/styles.css`: gaya biru ala spotsini.vercel.app (Plus Jakarta Sans, hero gelap bergradasi, kartu putih membulat).
   - `docs/sumber/fakta-riset-belum-digabung.json`: 72 baris fakta hasil riset (2025 dan 2026, termasuk LKPP 2025 audited) yang belum masuk tabel fakta, plus daftar data yang tidak ditemukan.
4. Jalankan `npm install` lalu `npm test`, dan pastikan semua tes lulus sebelum mengubah apa pun.

Stack tetap HTML + CSS + JavaScript modul tanpa framework dan tanpa build. Jangan menambah dependensi kecuali benar-benar perlu; grafik dibuat dengan SVG atau CSS biasa.

## Aturan yang wajib dijaga di keempat fitur

1. Setiap angka yang tampil berasal dari baris `data/fakta.js` dan bisa diketuk untuk membuka kartu sumber (dokumen, instansi, tahun, halaman, kutipan, tautan). Tidak ada baris, tidak ada angka. Ini juga berlaku untuk angka di grafik, label sumbu, dan teks yang dibuat AI.
2. Anggaran, Outlook, dan Realisasi selalu dipisah dan diberi label teks (bukan hanya warna). Realisasi selalu menyebut tanggal posisi data.
3. Satuan selalu ditulis (Rp triliun, Rp miliar, persen, orang, dsb.). Bila baris memakai satuan berbeda (mis. Rp miliar dan Rp triliun), kode menyamakannya dan cara konversinya ditampilkan.
4. Perhitungan (persentase, selisih, pertumbuhan) dikerjakan kode di `src/hitung.js`, rumusnya ditampilkan, dan hanya dihitung bila tahun dan cakupan pos kedua angka sama.
5. Data tidak ada: tampilkan "Data ini belum tersedia di dokumen yang dimuat Transkeu.ID." beserta tautan portal resmi. Jangan pernah menebak atau memperkirakan angka.
6. Netral: tidak menilai, memuji, atau mengkritik kebijakan; tidak mengarahkan isi aspirasi pengguna.
7. Setiap halaman dan tampilan menyebut "Proyek mahasiswa, bukan situs resmi pemerintah".
8. Ponsel 360 px dulu: satu kolom, tanpa geser ke samping, teks minimal 16 px, area sentuh minimal 44 x 44 px, kontras WCAG AA, fokus keyboard terlihat, hormati `prefers-reduced-motion`. Teks antarmuka bahasa Indonesia sederhana.
9. Tanpa login. Data pengguna hanya di perangkat (localStorage, dibungkus try/catch). Kunci API hanya di `.env` sisi server.

## Fitur 1: AI Fiscal Explainer

Tanya jawab tentang APBN dan istilah fiskal berdasarkan dokumen yang dimuat, dengan rujukan sumber. Dasarnya sudah ada (tab "Tanya AI"); tugasmu memastikan dan melengkapi.

- Jawaban dari AI melalui `/api/tanya` dengan penjaga angka; bila AI mati, gagal, atau ditolak penjaga, pakai `src/mesin.js` dan beri tanda "Mode dasar".
- Setiap jawaban berangka menampilkan kartu sumber untuk setiap angka. Jawaban konsep tanpa angka (mis. "kenapa APBN defisit?") tetap menyebut istilah terkait dan bisa membuka kamus.
- Istilah fiskal di jawaban bisa diketuk (kamus `data/istilah.js`). Pertanyaan "apa itu X" untuk istilah di kamus dijawab dari kamus.
- Pertanyaan di luar APBN pusat, tahun yang tidak dimuat, atau APBD dijawab dengan pesan baku, tanpa angka.

Kriteria selesai: tes penjaga dan mesin tetap lulus; ada tes baru yang memastikan setiap jawaban berangka punya minimal satu baris sumber; uji manual 10 pertanyaan di luar contoh (catat yang ditolak penjaga di `docs/uji-ai.md`).

## Fitur 2: Dashboard APBN

Grafik pendapatan, belanja, dan defisit, serta perbandingan anggaran dan realisasi sesuai ketersediaan data.

- Satu tampilan (bisa menggantikan atau memperluas "Dompet negara" di Beranda) berisi:
  - Grafik batang pendapatan negara, belanja negara, dan defisit untuk TA 2025 dan TA 2026, dengan batang terpisah untuk Anggaran, Outlook, dan Realisasi bila barisnya ada.
  - Perbandingan anggaran dan realisasi per pos dengan persentase yang dihitung kode (`persenRealisasi`) dan rumusnya.
  - Pembagian belanja: pemerintah pusat dan transfer ke daerah, serta belanja pusat menurut fungsi.
- Gabungkan baris dari `docs/sumber/fakta-riset-belum-digabung.json` yang dibutuhkan ke `data/fakta.js` (ubah ke format baris yang sama, isi `tanggal_posisi` untuk realisasi, samakan satuan). Setiap baris baru wajib lolos `tests/fakta.test.js` (angka muncul di kutipannya).
- Tiap batang dan angka bisa diketuk untuk membuka kartu sumber. Tanpa tooltip yang hanya muncul saat hover.
- Data kosong tampil sebagai sel "belum tersedia", bukan batang nol. Jangan menggambar batang untuk data yang tidak ada.
- Grafik dibuat dengan SVG inline yang aksesibel (`role="img"` + `aria-label` yang memuat nilainya) dan tetap terbaca di 360 px.

Kriteria selesai: tes untuk fungsi pemilih data grafik (baris mana yang dipakai per tahun dan jenis, tidak mencampur cakupan, tidak membuat nilai untuk data kosong) dan untuk konversi satuan.

## Fitur 3: Jejak Anggaran

Penelusuran dari alokasi ke realisasi ke capaian program, dengan kartu sumber (dokumen, halaman, kutipan, tautan resmi) di setiap langkah.

- Tampilan baru: pengguna memilih topik (enam topik di `data/topik.js`) atau program, lalu melihat jejak berurutan:
  1. Alokasi (Anggaran TA, dari UU APBN/DJA/APBN KiTa).
  2. Realisasi s.d. tanggal terbaru (dan persentase jika cakupannya sama).
  3. Program dan capaian keluaran, misalnya "PIP Rp11,2 T untuk 16 juta siswa", "PBI JKN untuk 96,7 juta orang".
- Capaian non-uang (jumlah siswa, orang, km jalan, unit rumah) juga harus berasal dari baris bersumber. Tambahkan struktur data yang jelas di `data/fakta.js` (mis. `capaian` dengan id, topik, program, tahun, posisi data, nilai, satuan, dokumen, halaman, kutipan, url) dan tes bahwa angka capaian muncul di kutipannya.
- Langkah yang datanya tidak ada ditampilkan sebagai "belum tersedia", tidak dilewati diam-diam.
- Ada tombol "Tanyakan ke AI" yang membuka Tanya AI dengan pertanyaan tentang langkah itu.

Kriteria selesai: tes untuk penyusun jejak (urutan langkah, tidak memasangkan realisasi dengan anggaran yang cakupannya berbeda, langkah kosong ditandai).

## Fitur 4: Aspirasi Berbasis Data

Panduan menyusun pertanyaan atau masukan, rujukan data pendukung, dan tautan ke kanal aspirasi resmi.

- Tampilan berupa langkah singkat:
  1. Pilih topik dan jenis aspirasi (pertanyaan, masukan, permintaan informasi).
  2. Pilih data pendukung dari tabel fakta (centang baris; tampil dengan label jenis angka dan sumbernya).
  3. Isi poin sendiri di kolom teks bebas.
  4. Aplikasi menyusun draf berisi isi pengguna dan daftar rujukan data (angka diisi kode dari baris yang dipilih, lengkap dengan dokumen dan halaman). Pengguna bisa menyalin draf.
  5. Tautan ke kanal aspirasi resmi, dibuka di tab baru. Mulai dari SP4N-LAPOR! (lapor.go.id) dan kanal aspirasi DPR RI; periksa dulu bahwa setiap URL aktif dan resmi sebelum dipasang, dan catat tanggal pemeriksaannya.
- Transkeu.ID tidak mengirim apa pun atas nama pengguna, tidak menyimpan nama atau kontak, dan menulis jelas bahwa aspirasi dikirim sendiri lewat kanal resmi.
- Panduan bersifat netral: contoh kalimat yang sopan dan spesifik ("Mohon penjelasan mengapa realisasi … s.d. … sebesar …"), tanpa menyarankan sikap politik.
- Draf disimpan sementara di perangkat (localStorage) agar tidak hilang saat pindah tab.

Kriteria selesai: tes untuk penyusun draf (angka hanya dari baris yang dipilih, setiap angka punya rujukan dokumen dan halaman, draf tanpa baris tidak memuat angka).

## Navigasi dan tampilan

- Maksimal lima item di menu utama, misalnya: Beranda (Dashboard APBN), Tanya AI, Jejak Anggaran, Aspirasi, dan Lainnya (Kamus, Kuis). Label harus muat di 360 px tanpa terpotong.
- Kolom tanya tetap di bawah layar dan tetap berfungsi dari tampilan mana pun.
- Ikuti `docs/design-system.md` dan ikon SVG di `src/ikon.js` (tanpa emoji).

## Cara bekerja dan melapor

- Kerjakan berurutan: Fitur 2 (butuh penggabungan data), lalu 3, 4, terakhir lengkapi 1. Setelah tiap fitur jalankan `npm test` dan periksa tampilan di lebar 360 px.
- Perubahan terkecil yang lengkap. Logika berisiko (pemilihan angka, perhitungan, konversi satuan, penyusunan jejak dan draf) wajib punya tes.
- Perbarui `README.md`, `docs/PRD.md` (bagian fitur), dan `CLAUDE.md` (cakupan fitur) agar sesuai keempat fitur ini.
- Jangan mengarang data. Bila sebuah angka tidak ada di dokumen yang dimuat, biarkan "belum tersedia" dan catat di laporan.
- Laporan akhir: fitur yang selesai, tes yang ditambahkan dan hasil `npm test`, baris data yang digabungkan, data yang masih kosong, dan hal yang belum diperiksa.
