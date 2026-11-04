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
copy .env.example .env   # isi OPENAI_API_KEY; LLM_PROVIDER=openai
npm start                # buka http://localhost:5173
npm test                 # menjalankan tes unit, kontrak provider, dan DOM
npm run audit:data       # audit metadata korpus fakta
```

## Konfigurasi Deployment Vercel

Situs dipublikasikan di Vercel dengan arsitektur serverless modern:
- **Frontend:** Berkas statis (`index.html`, `src/styles.css`, `src/app.js`) dengan logo resmi, per-paragraph citations, visual interaktif, Jejak Anggaran, dan Aspirasi Data.
- **Backend:** Vercel Serverless Function di `api/tanya.js` dan `api/health.js` didukung mesin retrieval leksikal, grounding validator, dan self-repair loop di folder `server/`.
- **Routing & Keamanan:** Dikonfigurasi melalui `vercel.json` (`maxDuration: 45`, no-store cache, nosniff, anti-clickjacking).

### Pengaturan Environment Variable di Vercel

Agar Tanya AI aktif di Vercel:

1. Buka dashboard proyek Anda di [vercel.com](https://vercel.com).
2. Pilih proyek **transkeu-id** -> Masuk ke tab **Settings** -> **Environment Variables**.
3. Tambahkan variabel berikut:
   - `LLM_PROVIDER`: `openai`.
   - `OPENAI_API_KEY`: kunci API dari akun OpenAI milik pengelola, hanya di server.
   - `OPENAI_MODEL`: `gpt-4.1-mini` (dapat disesuaikan dengan model yang tersedia pada akun).
   - `BATAS_TANYA_HARIAN`: `50` untuk batas harian per IP.
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, dan `RATE_LIMIT_SALT`: wajib untuk pembatas pemakaian lintas instance produksi. Buat salt acak yang tidak dipublikasikan.
   - `DATABASE_URL`: opsional untuk katalog PostgreSQL; tanpa ini aplikasi memakai katalog lokal.
   - Provider lama tetap tersedia: gunakan `LLM_PROVIDER=gemini` atau `anthropic` dan kunci server yang sesuai.
4. Lakukan **Redeploy** (atau *git push*) agar variabel lingkungan mulai berlaku.
5. Cek endpoint `https://transkeu-id.vercel.app/api/health` untuk memastikan konfigurasi terdeteksi dengan status `configured: true`. Status ini belum membuktikan panggilan model berhasil; uji pertanyaan sampai respons berisi `ai: true`.

| Path | Isi |
| --- | --- |
| `index.html`, `src/styles.css`, `src/app.js` | Tampilan aplikasi (F1-F6, Jejak Anggaran, Aspirasi Data, per-paragraph citations) |
| `src/visual.js` | Validasi dan rendering visual interaktif (batang, komposisi, garis, kartu angka, tabel data aksesibel) |
| `server/retrieval.js` | Retrieval leksikal eviden APBN, perluasan sinonim sehari-hari, dan konteks pertanyaan lanjutan |
| `server/prompt.js` | Instruksi sistem pemandu literasi fiskal dan JSON Schema terstruktur |
| `server/grounding.js` | Validator grounding: pencegahan halusinasi angka, kalkulasi persen, dan validasi visual |
| `server/llm.js` | Integrasi LLM (OpenAI, Google Gemini & Anthropic Claude) dengan self-repair loop |
| `server/handler.js` | Handler pertanyaan, rate limiting terdistribusi, dan fallback Mode Dasar transparan |
| `api/tanya.js`, `api/health.js` | Vercel Serverless Function endpoints |
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

## Integrasi OpenAI dan keterbatasan

Lihat [panduan aktivasi](docs/AKTIVASI-OPENAI.md). Endpoint aktif memakai `server/llm.js`; modul `src/ai.js` adalah jalur lama yang tetap dipertahankan untuk kompatibilitas tes. Pengunjung tidak perlu memasukkan kunci API. Kunci yang dahulu disimpan pada peramban dihapus saat layar sambutan dimuat.

Artikel Melek APBN merupakan bacaan pendamping, bukan sumber angka resmi. Katalog `data/bukti-lapangan.js` masih kosong: sistem menyatakan bukti belum tersedia, bukan menyimpulkan program tidak berdampak. Retrieval saat ini berbasis kata kunci dari korpus yang dikurasi, belum pencarian seluruh dokumen pemerintah atau sinkronisasi berita otomatis.
