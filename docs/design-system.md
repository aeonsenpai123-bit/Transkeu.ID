# Design system Transkeu.ID

Arah visual mengacu [spotsini.vercel.app](https://spotsini.vercel.app/) (hero gelap bergradasi dengan cahaya, kartu putih membulat 24 px, input berbentuk pil, lencana kecil huruf kapital, judul sangat tebal), dengan nada warna biru. Prinsip aksesibilitas dari ui-ux-pro-max (Government/Public Service, Accessible & Ethical) tetap berlaku. Token ada di `:root` pada `src/styles.css`.

- **Huruf:** Plus Jakarta Sans 400/600/700/800 (Google Fonts, `display=swap`). Judul 800 dengan letter-spacing negatif; isi 16 px, tidak ada teks di bawah 12 px (hanya lencana).
- **Pola:** mobile-first 360 px, satu kolom, lebar maksimal 720 px. Menu 4 tab di kepala, kolom tanya tetap di bawah.
- **Ikon:** set SVG garis 2 px sendiri di `src/ikon.js`, selalu `aria-hidden` di samping teks. Tanpa emoji.
- **Aksesibilitas:** area sentuh ≥ 44 px, cincin fokus 3 px, tautan lompat ke kolom tanya, `prefers-reduced-motion` dihormati, label jenis angka berupa teks (bukan hanya warna).
- **Mode gelap:** belum ada; halaman terang dengan hero gelap.

| Token | Warna | Dipakai untuk |
| --- | --- | --- |
| --biru-900 / --biru-950 | #0A1F44 / #061633 | Kepala, latar hero |
| --biru-600 / --biru-700 | #2563EB / #1D4ED8 | Tombol utama, tautan, batang data |
| --langit | #7DD3FC | Aksen di atas latar gelap, TKD |
| --biru-50 / --biru-100 | #EFF6FF / #DBEAFE | Chip, lencana, latar ikon |
| --bg | #F5F7FB | Latar halaman |
| --tinta / --redup | #0B1220 / #5B6475 | Teks utama / sekunder |

| Jenis angka | Teks di latar |
| --- | --- |
| Anggaran | #0B3B8C di #DBEAFE |
| Outlook | #6B21A8 di #F3E8FF |
| Realisasi | #166534 di #DCFCE7 |
