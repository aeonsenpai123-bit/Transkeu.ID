# Transkeu.ID

Asisten literasi fiskal: warga bertanya tentang APBN, jawaban selalu menyebut sumber resmi yang bisa diperiksa. Prototipe penelitian Akuntansi Sektor Publik, Universitas Negeri Jakarta. Daring di [transkeu-id.vercel.app](https://transkeu-id.vercel.app/).

## Fitur Utama

1. **Tanya AI & Mesin Aturan Cadangan (F1):** Penjelasan APBN berbasis LLM dengan penjaga ketat (`src/penjaga.js`). Jika AI tidak aktif atau mengalami kendala, sistem secara transparan beralih ke Mode Dasar (aturan sistem) tanpa mengarang angka.
2. **Kartu Sumber (F2):** Setiap angka dapat diklik untuk membuka bottom sheet berisi dokumen resmi, penerbit, nomor halaman/tabel, kutipan asli, dan tautan PDF langsung.
3. **Kartu Topik & Arus Kas APBN (F3):** Visualisasi dompet negara, pembagian belanja pemerintah pusat vs TKD, serta 6 kartu topik utama (Pendidikan, Kesehatan, Perlindungan Sosial, Infrastruktur, Subsidi Energi, Pajak).
4. **Visual Interaktif Percakapan:** Grafik batang perbandingan alokasi vs realisasi, grafik komposisi proporsi belanja, grafik garis tren periode, serta tampilan tabel data aksesibel.
5. **Kamus Istilah (F4):** 38+ istilah fiskal dan komparasi tanpa jargon teknis, dengan pencarian real-time dan tag interaktif di dalam jawaban.
6. **Umpan Balik & Ekspor Data (F5):** Laporan akurasi angka dan ekspor JSON untuk pengujian empiris.
7. **Kuis Pemahaman (F6):** Pre-test & Post-test 5 soal pemahaman konsep fiskal untuk mengukur peningkatan literasi pengguna.
8. **Jejak Anggaran (Paper Inovatif):** Menelusuri rantai kebijakan Alokasi -> Realisasi Belanja -> Capaian Fisik Program Nyata (PIP, KIP Kuliah, BOS, PBI JKN, Skrining Kesehatan, Jalan Nasional, Subsidi Energi).
9. **Aspirasi Berbasis Data (Paper Inovatif):** Panduan warga menyusun draf aspirasi dan kritik kebijakan publik yang santun dan berbasis data anggaran, dilengkapi tautan kanal resmi nasional (SP4N-LAPOR!, Portal DPR RI, Kemenkeu WISE, Ombudsman RI).

## Menjalankan Prototipe Lokal

Butuh Node.js 22 atau lebih baru. Tanpa langkah build rumit.

```powershell
npm install
copy .env.example .env   # lalu isi GEMINI_API_KEY di .env (opsional)
npm start                # buka http://localhost:5173
npm test                 # menjalankan 42 tes unit otomatis
```

## Konfigurasi Deployment Vercel

Situs dipublikasikan di Vercel dengan arsitektur serverless:
- **Frontend:** Berkas statis (`index.html`, `src/styles.css`, `src/app.js`).
- **Backend:** Vercel Serverless Function di `api/tanya.js` (didukung `src/api-handler.js` dan `@google/genai`).
- **Routing:** Dikonfigurasi melalui `vercel.json`.

### Pengaturan Environment Variable di Vercel

Agar Tanya AI aktif di Vercel dengan LLM Google Gemini:

1. Buka dashboard proyek Anda di [vercel.com](https://vercel.com).
2. Pilih proyek **transkeu-id** -> Masuk ke tab **Settings** -> **Environment Variables**.
3. Tambahkan variabel berikut:
   - `GEMINI_API_KEY`: Kunci API Google Gemini (dapat dibuat gratis di [Google AI Studio](https://aistudio.google.com/)).
   - `GEMINI_MODEL` *(Opsional)*: Nama model, misalnya `gemini-2.5-flash` (bawaan) atau `gemini-1.5-flash`.
   - `BATAS_TANYA_HARIAN` *(Opsional)*: Batas pertanyaan AI per IP per hari (bawaan: `50`).
4. Lakukan **Redeploy** (atau *git push*) agar variabel lingkungan mulai berlaku.
5. Jika variabel belum diisi, sistem secara otomatis dan aman menggunakan **Mode Dasar** (jawaban berbasis aturan tabel fakta).

| Path | Isi |
| --- | --- |
| `index.html`, `src/styles.css`, `src/app.js` | Tampilan aplikasi (F1 sampai F6, Jejak Anggaran, Aspirasi Data) |
| `src/visual.js` | Validasi dan rendering visual interaktif (batang, komposisi, garis, kartu angka) |
| `src/api-handler.js` | Handler backend terpadu untuk POST `/api/tanya` (Vercel & lokal) |
| `api/tanya.js` | Vercel Serverless Function endpoint |
| `src/ai.js` | Integrasi Google Gemini (`@google/genai`) dengan persona pemandu literasi fiskal |
| `src/penjaga.js` | Penjaga keamanan AI: memvalidasi teks dan mengisi placeholder dari tabel fakta |
| `src/mesin.js` | Mesin aturan deterministik cadangan (Mode Dasar) |
| `src/hitung.js` | Format angka gaya Indonesia dan kalkulasi persentase |
| `data/fakta.js` | Tabel fakta: baris data resmi dengan kutipan dokumen dan tautan |
| `data/jejak.js` | Data Jejak Anggaran: Alokasi, Realisasi, dan Capaian fisik program |
| `data/aspirasi.js` | Perumusan draf aspirasi publik dan daftar kanal resmi pemerintah |
| `data/topik.js`, `data/istilah.js`, `data/kuis.js` | Kartu topik, kamus istilah, soal kuis |
| `vercel.json` | Konfigurasi runtime Vercel dan header keamanan |

Sumber angka saat ini: 23 PDF APBN KiTa (Kemenkeu) yang daftar URL-nya ada di `docs/sumber/apbn-kita/daftar.txt`. Unduh ulang lalu cari angka beserta halamannya dengan:

```powershell
node scripts/cari-pdf.js ekstrak                      # PDF -> teks per halaman (butuh pdftotext)
node scripts/cari-pdf.js cari "ANGGARAN PENDIDIKAN"   # baris yang cocok + nomor halaman
node scripts/cari-pdf.js halaman konpers-2026-10 29   # isi satu halaman
```

Menambah angka: tambah baris di `data/fakta.js`, isi `diperiksa_oleh` setelah dicek dua orang, lalu jalankan `npm test`. Tes menolak baris yang angkanya tidak muncul di kutipannya.

Umpan balik dan skor kuis disimpan di perangkat pengguna (localStorage). Tim mengumpulkannya lewat tombol "Unduh umpan balik" di kaki halaman.

## Mulai dengan Claude Code (Windows)

1. Buka PowerShell di folder ini, lalu jalankan `claude`.
2. Pasang plugin lokal (sekali saja), di dalam Claude Code:

   ```
   /plugin marketplace add ./plugins
   /plugin install mattpocock-skills@transkeu-local
   /plugin install ui-ux-pro-max@transkeu-local
   ```

   Skill `ponytail` sudah otomatis aktif dari `.claude/skills/`.
3. Server MCP 21st.dev: simpan kunci API sebagai variabel lingkungan, lalu tutup dan buka lagi terminal:

   ```powershell
   setx API_KEY_21ST "kunci-anda"
   ```

   Saat pertama dibuka, Claude Code akan meminta persetujuan untuk server `21st` dari `.mcp.json`.
4. Mulai: minta Claude membaca `CLAUDE.md` dan `docs/PRD.md`, lalu `/grill-me` untuk memilih tech stack dan rencana F1–F2.

## Isi folder

| Path | Isi |
| --- | --- |
| `CLAUDE.md` | Konteks dan aturan yang dibaca Claude Code setiap sesi |
| `docs/PRD.md` | Product Requirements Document |
| `docs/design-system.md` | Draf warna dan gaya dari ui-ux-pro-max |
| `docs/sumber/` | Naskah produk inovatif asli |
| `.claude/skills/ponytail/` | Skill kode minimal (MIT, adaptasi DietrichGebert/ponytail) |
| `plugins/` | Salinan lokal plugin mattpocock-skills (MIT) dan ui-ux-pro-max (MIT) |
| `.mcp.json` | Server MCP 21st.dev |
