# Aktivasi OpenAI untuk Transkeu.ID

Perubahan disiapkan berdasarkan repositori aeonsenpai123-bit/Transkeu.ID, commit awal 81f7637. Belum dikirim ke GitHub atau diterapkan di Vercel pada tahap penyiapan ini.

## Yang tersedia

- OpenAI Responses API dengan JSON Schema ketat dan satu kesempatan perbaikan jika validasi sumber gagal.
- Bahasa sehari-hari melalui instruksi sistem; angka diisi oleh kode dari fakta yang lolos metadata, bukan angka bebas dari model.
- Sumber per paragraf, grafik dan tabel interaktif yang sudah ada, serta konteks pertanyaan lanjutan.
- Bacaan terkait Melek APBN dan panel hasil/dampak dari modul yang sudah ada di repositori.
- Pemilihan provider eksplisit; Gemini dan Claude tetap dapat dipakai.
- Kunci API hanya dari server. Penyimpanan kunci pada browser dan badge aktivasi semu dihapus.
- Pembatas pemakaian lintas instance produksi wajib tersedia sebelum panggilan AI berbayar.
- Dependensi PostgreSQL yang diperlukan modul katalog ditambahkan.

## Menerapkan patch

Dari repositori bersih yang masih pada commit dasar di atas:

```sh
git switch -c feat/openai-tanya-ai
git apply --check transkeu-openai.patch
git apply transkeu-openai.patch
npm ci
npm test
```

Jangan paksa patch jika pemeriksaan gagal; gabungkan perubahannya dengan versi terbaru. Paket juga memuat format-patch untuk opsi `git am transkeu-openai.commit.patch`, gunakan salah satu metode saja.

## Mengaktifkan di Vercel

1. Masukkan perubahan melalui branch dan pull request di repositori yang benar.
2. Pada proyek Vercel yang terhubung, isi Environment Variables untuk Preview terlebih dahulu:

| Nama | Nilai |
| --- | --- |
| LLM_PROVIDER | openai |
| OPENAI_API_KEY | Kunci API milik pengelola, jangan ditempel dalam chat atau kode |
| OPENAI_MODEL | gpt-4.1-mini, atau model yang mendukung Structured Outputs dan tersedia di akun |
| UPSTASH_REDIS_REST_URL | URL REST instance Redis pengelola |
| UPSTASH_REDIS_REST_TOKEN | Token REST Redis pengelola |
| RATE_LIMIT_SALT | Nilai acak rahasia |
| BATAS_TANYA_HARIAN | 50 |
| DATABASE_URL | Opsional, koneksi PostgreSQL |

3. Deploy Preview. Cek `/api/health`: `provider: openai`, `configured: true`, `limiter_configured: true`. Ini hanya memeriksa keberadaan konfigurasi.
4. Tanyakan “Duit buat sekolah tahun 2026 berapa?”; pastikan respons `/api/tanya` memiliki `ai: true`, rujukan terbuka, dan grafik sesuai angka jawaban. Uji pertanyaan lanjutan, tahun tanpa data, dan konsep tanpa grafik.
5. Uji kartu Melek APBN yang relevan dan Jejak Anggaran. Panel hasil lapangan harus jujur bahwa bukti belum dimuat.
6. Setelah Preview lolos, isi variabel Production dan terapkan perubahan ke branch deployment. Periksa pengeluaran dan batas pemakaian pada akun API.

Akses ChatGPT dalam percakapan ini bukan kunci API aplikasi. Pengelola memerlukan akses API dan kuota pada akun OpenAI sendiri. Jangan menyalin kredensial percakapan atau token ChatGPT ke website.

## Memasukkan artikel dan hasil lapangan

Tanpa DATABASE_URL, kurasi metadata di `data/artikel.js` dan bukti di `data/bukti-lapangan.js`. Dengan PostgreSQL, jalankan `npm run db:seed-artikel` setelah mengisi DATABASE_URL di lingkungan server tepercaya. Perintah tersebut membuat kedua tabel dan memasukkan metadata artikel; tidak mengisi bukti dampak rekaan.

Setiap bukti lapangan harus cocok dengan program, tahun anggaran, wilayah, dan sumber pendanaan. Bedakan output, outcome, temuan pelaksanaan, dan dampak kausal. Berita pendamping tidak otomatis membuktikan dampak. Antarmuka lokasi belum tersedia; konteks wilayah dapat dikirim melalui API. Baca `docs/HASIL-DAN-DAMPAK.md` dan `docs/MELEK-APBN.md`.

## Verifikasi penyiapan

103 tes otomatis lulus, termasuk kontrak OpenAI yang disimulasikan, validasi angka/sumber/grafik, fallback produksi tanpa limiter, dan render DOM. Belum ada panggilan OpenAI dengan kunci nyata, migrasi PostgreSQL nyata, atau deployment Vercel. Hasil tes bukan angka akurasi model terhadap paper.

## Dokumentasi resmi OpenAI

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-4.1-mini

Dokumentasi diakses pada tahap implementasi. Model dapat diubah melalui OPENAI_MODEL sesuai akses akun; validasi ulang jawaban setelah perubahan.
