# Transkeu.ID

Situs web ramah ponsel tempat warga bertanya tentang APBN dan mendapat jawaban sederhana yang selalu menyebut sumber yang bisa diperiksa. Prototipe mahasiswa (Akuntansi Sektor Publik, UNJ). Spesifikasi lengkap: `docs/PRD.md`. Naskah asal: `docs/sumber/`.

## Status

Belum ada kode. Yang sudah ada: PRD, draf design system (`docs/design-system.md`), skill dan plugin, konfigurasi MCP 21st.dev. Tech stack belum dipilih; tanyakan atau usulkan yang paling kecil sebelum membangun.

## Aturan produk yang tidak boleh dilanggar

Ini inti produk. Kode, prompt AI, dan tes harus menjaganya.

1. Angka di jawaban hanya boleh berasal dari tabel fakta (baris dengan dokumen, instansi, tahun, halaman/tabel, kutipan, URL). Tidak ada baris, tidak ada angka.
2. Anggaran, Outlook, dan Realisasi selalu dipisah dan diberi label. Realisasi selalu dengan tanggal posisi data.
3. Satuan selalu ditulis (Rp triliun, Rp miliar, persen).
4. Perhitungan dikerjakan kode, bukan model bahasa, dan cara hitungnya ditampilkan. Hanya hitung jika tahun dan cakupan pos kedua angka sama.
5. Data tidak ada → "Data ini belum tersedia di dokumen yang dimuat Transkeu.ID." plus tautan portal resmi. Jangan pernah menebak angka.
6. Netral: tidak menilai kebijakan.
7. Setiap halaman menyebut "proyek mahasiswa, bukan situs resmi pemerintah".

Cakupan versi awal: APBN pusat TA 2025 dan 2026, enam topik, tanpa login, tanpa APBD, bahasa Indonesia. Fitur F1 (Tanya Anggaran) dan F2 (Kartu Sumber) dulu; F3 sampai F6 menyusul.

## Cara kerja

- **Kode:** pakai skill `ponytail`. Perubahan terkecil yang lengkap, logika berisiko (angka, perhitungan, pemilihan sumber) wajib punya tes.
- **Perencanaan:** plugin `mattpocock-skills`. Alur yang disarankan: `/grill-me` untuk mematangkan rencana, `/to-spec` lalu `/to-tickets`, kerjakan dengan `/tdd`. Jalankan `/setup-matt-pocock-skills` sekali sebelum skill yang memakai issue tracker.
- **UI:** plugin `ui-ux-pro-max`. Mulai dari `docs/design-system.md`, jalankan ulang `--design-system` setelah stack dipilih. Ponsel 360 px dulu, teks minimal 16 px, area sentuh 44 px, kontras WCAG AA.
- **Komponen UI:** server MCP `21st` (`.mcp.json`) bila perlu contoh komponen. Butuh variabel lingkungan `API_KEY_21ST`.
- Teks antarmuka dalam bahasa Indonesia yang sederhana.

## Jangan

- Jangan menaruh kunci API di repo. `.env` sudah di `.gitignore`.
- Jangan menambah fitur di luar PRD (APBD, berita, dasbor publik, login) tanpa diminta.
