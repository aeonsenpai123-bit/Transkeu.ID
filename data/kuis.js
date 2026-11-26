// Kuis pemahaman & latihan sumber (PRD F6 + Pilot UNJ / Pilmapres Diploma 2026).
// Dua set soal evaluasi paralel (Set A Pre-test & Set B Post-test) dengan kompetensi, tingkat kesulitan, dan bobot setara.
// Jalur latihan bertingkat berbasis kartu sumber dipisah dari skor evaluasi.

export const VERSI_SOAL = '2026.11-unj-v2';

export const KOMPETENSI_LABEL = {
  jenis_angka: 'Membedakan jenis angka (Pagu/Anggaran, Realisasi, Outlook)',
  tanggal_posisi: 'Membaca tanggal posisi dan periode pelaporan',
  cakupan: 'Membedakan cakupan program, fungsi, dan kementerian',
  validitas_perbandingan: 'Menentukan apakah dua angka boleh dibandingkan',
  sumber_resmi: 'Menemukan dan memeriksa sumber resmi (bukan sekadar serapan)',
};

export const kuisSetA = [
  {
    id: 'a1',
    kompetensi: 'jenis_angka',
    soal: 'Sebuah berita menulis "Anggaran pendidikan TA 2026 sebesar Rp769,1 triliun". Angka tersebut menunjukkan…',
    pilihan: [
      'Uang yang sudah benar-benar cair ke sekolah',
      'Rencana batas belanja pendidikan yang ditetapkan UU APBN',
      'Perkiraan belanja sampai akhir tahun',
      'Sisa anggaran pendidikan tahun lalu',
    ],
    benar: 1,
    alasan: 'Anggaran (pagu) adalah rencana batas belanja satu tahun anggaran, bukan uang yang sudah dibelanjakan.',
  },
  {
    id: 'a2',
    kompetensi: 'tanggal_posisi',
    soal: 'Di APBN KiTa tertulis "Realisasi PIP Rp11,2 T s.d. 30 September 2026". Artinya angka Rp11,2 T adalah…',
    pilihan: [
      'Dana yang hanya cair tepat pada tanggal 30 September',
      'Target maksimal penyaluran PIP sampai akhir 2026',
      'Dana PIP yang sudah disalurkan kumulatif dari 1 Januari sampai 30 September 2026',
      'Perkiraan penyaluran PIP untuk bulan Oktober–Desember',
    ],
    benar: 2,
    alasan: 'Tanggal posisi "s.d. 30 September" menunjukkan total kumulatif sejak awal tahun anggaran (1 Januari) hingga tanggal cutoff tersebut.',
  },
  {
    id: 'a3',
    kompetensi: 'cakupan',
    soal: 'Mengapa total Anggaran Pendidikan (Rp769,1 T) berbeda jauh dengan pagu awal Kemendikdasmen (Rp56,68 T)?',
    pilihan: [
      'Karena sisanya merupakan keuntungan kementerian',
      'Karena anggaran pendidikan mencakup belanja berbagai K/L pusat, Transfer ke Daerah (seperti BOS), dan pembiayaan',
      'Karena Kemendikdasmen memakai tahun anggaran yang berbeda',
      'Karena angka Kemendikdasmen sudah dikurangi inflasi',
    ],
    benar: 1,
    alasan: 'Anggaran pendidikan 20% APBN tersebar lintas K/L pusat (Kemendikdasmen, Kemdiktisaintek, Kemenag, dll.), TKD (BOS), dan pembiayaan.',
  },
  {
    id: 'a4',
    kompetensi: 'validitas_perbandingan',
    soal: 'Alokasi gabungan PIP/KIP Kuliah/beasiswa lain Rp63,8 T dan realisasi khusus PIP s.d. September Rp11,2 T. Bolehkah langsung dihitung Rp11,2 T ÷ Rp63,8 T sebagai persentase serapan PIP?',
    pilihan: [
      'Boleh, selama satuannya sama-sama Rp triliun',
      'Boleh, asal dibulatkan satu angka di belakang koma',
      'Tidak boleh, karena pagu Rp63,8 T mencakup beberapa program lain selain PIP',
      'Boleh, karena keduanya terjadi pada tahun 2026',
    ],
    benar: 2,
    alasan: 'Rasio penyerapan hanya sah jika tahun, satuan, dan cakupan programnya sama. Pagu paket beasiswa lebih luas daripada realisasi PIP saja.',
  },
  {
    id: 'a5',
    kompetensi: 'sumber_resmi',
    soal: 'Ada unggahan media sosial menyebut jumlah siswa penerima PIP dan menyimpulkan mutu belajar pasti meningkat tanpa lampiran dokumen. Langkah paling tepat adalah…',
    pilihan: [
      'Mempercayai karena jumlah penerimanya besar',
      'Menyamakan realisasi kas dengan keberhasilan dampak pendidikan',
      'Memeriksa dokumen resmi asal angka beserta halaman/kutipannya, lalu membedakan jumlah penerima dari bukti evaluasi dampak',
      'Mengganti angkanya dengan data APBD daerah lain',
    ],
    benar: 2,
    alasan: 'Realisasi dan output (jumlah penerima) bukan bukti dampak; klaim wajib diverifikasi ke dokumen resmi, halaman, dan evaluasi tersendiri.',
  },
];

export const kuisSetB = [
  {
    id: 'b1',
    kompetensi: 'jenis_angka',
    soal: 'Laporan keuangan negara memuat angka "Outlook belanja tahun berjalan". Istilah outlook berarti…',
    pilihan: [
      'Pagu batas tertinggi yang disahkan DPR pada awal tahun',
      'Perkiraan hasil akhir tahun berdasarkan realisasi yang sudah ada ditambah proyeksi sisa tahun',
      'Angka audit final BPK setelah tahun anggaran berakhir',
      'Dana cadangan daerah yang tidak terpakai',
    ],
    benar: 1,
    alasan: 'Outlook adalah perkiraan sampai akhir tahun, sehingga harus dibedakan dari anggaran awal maupun realisasi final.',
  },
  {
    id: 'b2',
    kompetensi: 'tanggal_posisi',
    soal: 'Subsidi Energi tercatat Rp78,7 T pada posisi "s.d. 30 Juni 2026", sementara Belanja Negara tercatat "s.d. 30 September 2026". Apa hal pertama yang perlu diperhatikan?',
    pilihan: [
      'Keduanya boleh langsung dibandingkan karena masih tahun 2026',
      'Tanggal posisi keduanya berbeda (Juni vs September), sehingga cakupannya secara waktu belum setara',
      'Angka bulan Juni pasti sudah termasuk penyaluran bulan September',
      'Tanggal posisi tidak berpengaruh pada angka realisasi',
    ],
    benar: 1,
    alasan: 'Realisasi bersifat kumulatif sepanjang tahun berjalan. Membandingkan angka per Juni dengan per September akan menyesatkan karena selisih tiga bulan.',
  },
  {
    id: 'b3',
    kompetensi: 'cakupan',
    soal: 'Dana Bantuan Operasional Sekolah (BOS) sebesar Rp52,8 T disalurkan dari APBN melalui mekanisme…',
    pilihan: [
      'Belanja pegawai satu kementerian saja',
      'Transfer ke Daerah (TKD) langsung ke sekolah',
      'Penerimaan Negara Bukan Pajak (PNBP)',
      'Sisa Lebih Pembiayaan Anggaran (SiLPA)',
    ],
    benar: 1,
    alasan: 'APBN KiTa mencatat penyaluran Dana BOS berada di bawah jalur Transfer ke Daerah (TKD), bukan belanja internal kementerian.',
  },
  {
    id: 'b4',
    kompetensi: 'validitas_perbandingan',
    soal: 'Kapan persentase serapan (Realisasi ÷ Anggaran × 100%) sah dihitung dalam pembacaan APBN?',
    pilihan: [
      'Setiap kali ada dua angka yang sama-sama berlabel Rp triliun',
      'Ketika jenis angka (Realisasi dan Anggaran), tahun anggaran, satuan, serta cakupan program/pos keduanya cocok',
      'Ketika kedua angka berasal dari tahun yang berurutan (2025 dan 2026)',
      'Kapan saja selama menggunakan kalkulator resmi',
    ],
    benar: 1,
    alasan: 'Pembagian hanya valid bila basis pagu dan realisasinya merujuk pada cakupan pos, tahun anggaran, dan satuan yang sama.',
  },
  {
    id: 'b5',
    kompetensi: 'sumber_resmi',
    soal: 'Untuk memeriksa apakah klaim angka APBN TA 2026 tentang realisasi penyaluran PIP benar, sumber utama yang paling tepat dirujuk adalah…',
    pilihan: [
      'Opini kolom komentar media sosial',
      'Paparan atau Buletin APBN KiTa Kemenkeu beserta nomor halaman dan kutipannya',
      'Ringkasan artikel opini tanpa rincian halaman',
      'Angka anggaran tahun 2025 tanpa penyesuaian',
    ],
    benar: 1,
    alasan: 'Realisasi berjalan selama tahun anggaran bersumber dari publikasi APBN KiTa Kemenkeu yang mencantumkan edisi, halaman, dan tanggal posisi.',
  },
];

// Ekspor default `kuis` dipertahankan demi kompatibilitas bagian lain yang merujuk `kuis.length`.
export const kuis = kuisSetA;

// Jalur latihan bertingkat berbasis kartu sumber (terpisah dari skor pre/post-test).
export const latihanBertingkat = [
  {
    id: 'latihan-dasar-posisi',
    tingkat: 'Tingkat 1 · Dasar',
    judul: 'Membaca Jenis Angka & Tanggal Posisi',
    kompetensi: 'tanggal_posisi',
    faktaId: 'pendidikan-2026-realisasi-sep',
    kutipanKartu: 'ANGGARAN PENDIDIKAN Rp574,2 T s.d. 30 September 2026 (Paparan Konferensi Pers APBN KiTa Oktober 2026, hlm. 29)',
    pertanyaan: 'Berdasarkan kutipan kartu sumber di atas, apakah angka Rp574,2 triliun berarti seluruh anggaran pendidikan tahun 2026 sudah habis dibelanjakan?',
    pilihan: [
      'Ya, karena angkanya sudah melebihi Rp500 triliun',
      'Tidak, angka itu adalah realisasi sementara s.d. 30 September 2026 dan masih dapat bertambah sampai akhir tahun',
      'Ya, karena merupakan pagu awal UU APBN',
    ],
    benar: 1,
    pembahasan: 'Realisasi "s.d. 30 September 2026" berarti penyerapan baru dicatat selama 9 bulan (Januari–September). Masih ada sisa tahun berjalan (Oktober–Desember).',
  },
  {
    id: 'latihan-pip-cakupan',
    tingkat: 'Tingkat 2 · Menengah (Studi Kasus PIP)',
    judul: 'Uji Validitas Perbandingan: Pagu Beasiswa vs Realisasi PIP',
    kompetensi: 'validitas_perbandingan',
    faktaId: 'pip-2026-realisasi-sep',
    faktaPembandingId: 'beasiswa-2026-anggaran',
    kutipanKartu: 'Sumber 1 (DJA Kemenkeu, 14 Okt 2025): "Program PIP/KIP Kuliah/Beasiswa lainnya dengan alokasi sebesar Rp63,8 triliun". Sumber 2 (APBN KiTa Okt 2026, hlm. 29): "Penyaluran PIP Rp11,2 T untuk 16 juta siswa".',
    pertanyaan: 'Dapatkah kita menghitung persentase penyerapan PIP dengan membagi Rp11,2 T ÷ Rp63,8 T?',
    pilihan: [
      'Dapat, hasilnya sekitar 17,6% penyerapan PIP',
      'Tidak dapat, karena Rp63,8 T adalah pagu gabungan (PIP, KIP Kuliah, dan beasiswa lain), sedangkan Rp11,2 T hanya realisasi PIP saja',
      'Dapat, asalkan tahunnya sama-sama 2026',
    ],
    benar: 1,
    pembahasan: 'Tepat! Cakupan pagu Rp63,8 triliun lebih luas karena menggabungkan KIP Kuliah dan beasiswa lain. Jika dibagi dengan realisasi PIP saja, persentasenya akan tampak jauh lebih kecil daripada kondisi sebenarnya.',
  },
  {
    id: 'latihan-lanjut-dampak',
    tingkat: 'Tingkat 3 · Lanjut',
    judul: 'Membedakan Output Penyaluran dari Dampak Lokal',
    kompetensi: 'sumber_resmi',
    faktaId: 'pip-2026-realisasi-sep',
    kutipanKartu: 'Penyaluran PIP Rp11,2 T untuk 16 juta siswa s.d. 30 September 2026 (APBN KiTa Okt 2026, hlm. 29).',
    pertanyaan: 'Jika seorang siswa di Jakarta Timur ingin memastikan apakah PIP menurunkan angka putus sekolah di sekolahnya, apakah kutipan nasional ini cukup menjadi bukti?',
    pilihan: [
      'Cukup, karena 16 juta siswa sudah membuktikan program berhasil di semua sekolah',
      'Belum cukup; kutipan ini membuktikan penyaluran dana dan jumlah penerima nasional, sedangkan kondisi sekolah tertentu dan dampak belajar memerlukan data lokal & evaluasi resmi',
      'Cukup, asalkan ditambah angka total pendapatan negara',
    ],
    benar: 1,
    pembahasan: 'Realisasi kas (Rp11,2 T) dan output penyaluran (16 juta siswa) secara nasional belum membuktikan dampak kausal maupun kondisi spesifik di satu sekolah atau wilayah seperti Jakarta Timur.',
  },
];
