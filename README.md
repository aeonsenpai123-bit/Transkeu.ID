# Transkeu.ID

Asisten literasi fiskal: warga bertanya tentang APBN, jawaban selalu menyebut sumber resmi yang bisa diperiksa. Lihat `docs/PRD.md`.

## Menjalankan prototipe

Butuh Node.js 22 atau lebih baru. Tanpa build.

```powershell
npm install
copy .env.example .env   # lalu isi ANTHROPIC_API_KEY di .env
npm start                # buka http://localhost:5173
npm test                 # tes hitung, mesin jawab, penjaga AI, dan validasi tabel fakta
```

**Cara kerja AI (Tanya AI).** Server (`scripts/serve.js`) memanggil Claude (`src/ai.js`) dengan persona pemandu literasi fiskal dan seluruh tabel fakta. Model hanya boleh memilih id baris dan menulis penjelasan dengan placeholder `{{id}}`; `src/penjaga.js` mengisi angka dari tabel fakta, menghitung persentase dengan kode, dan menolak jawaban yang memuat angka lain. Jika AI mati (tanpa kunci), gagal, atau ditolak penjaga, browser memakai mesin aturan (`src/mesin.js`) dan menandainya "Mode dasar". Kunci API hanya ada di server. Batas pertanyaan AI per IP per hari diatur `BATAS_TANYA_HARIAN`.

| Path | Isi |
| --- | --- |
| `index.html`, `src/styles.css`, `src/app.js` | Tampilan (F1 sampai F6) |
| `src/mesin.js` | Memahami pertanyaan dan memilih baris tabel fakta (berbasis kata kunci, belum memakai model bahasa) |
| `src/hitung.js` | Format angka dan persentase realisasi; satu-satunya tempat perhitungan |
| `data/fakta.js` | Tabel fakta: satu baris per angka, lengkap dengan dokumen, halaman, kutipan, URL |
| `data/topik.js`, `data/istilah.js`, `data/kuis.js` | Kartu topik, kamus istilah, soal kuis |

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
