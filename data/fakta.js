// Tabel fakta: satu baris per angka yang boleh tampil di Transkeu.ID.
// Sumber: publikasi APBN KiTa Kemenkeu yang diunduh ke docs/sumber/apbn-kita/ (daftar URL di daftar.txt).
// halaman_atau_tabel = nomor halaman PDF. Kutipan disalin dari teks PDF; "[...]" menandai bagian yang dilewati.
// diperiksa_oleh masih kosong: setiap baris wajib dicek dua anggota tim sebelum rilis (PRD).

const KONPERS_OKT = {
  dokumen: 'Paparan Konferensi Pers APBN KiTa Oktober 2026 (Kinerja APBN s.d. 30 September 2026)',
  penerbit: 'Kementerian Keuangan',
  tahun_dokumen: 2026,
  url: 'https://media.kemenkeu.go.id/getmedia/044b5248-bdb9-4434-adf7-62fd50e93f3d/Publikasi-Web-Konpers-APBN-KiTa-(Oktober-2026)-(1).pdf?ext=.pdf',
};
const KONPERS_FEB = {
  dokumen: 'Paparan Konferensi Pers APBN KiTa Februari 2026 (Kinerja APBN s.d. 31 Januari 2026)',
  penerbit: 'Kementerian Keuangan',
  tahun_dokumen: 2026,
  url: 'https://media.kemenkeu.go.id/getmedia/89672833-8f45-4160-87fd-dbb441714b13/Publikasi-Web-Konpers-APBN-Kita-(Februari-2026).pdf?ext=.pdf',
};
const KONPERS_JAN = {
  dokumen: 'Paparan Konferensi Pers APBN KiTa Januari 2026 (Realisasi Sementara APBN 2025)',
  penerbit: 'Kementerian Keuangan',
  tahun_dokumen: 2026,
  url: 'https://media.kemenkeu.go.id/getmedia/b7f00cc5-15ad-4d8d-9bb5-42e18e8494a8/Publikasi-Web-Konpers-APBN-Kita-(Januari-2026).pdf?ext=.pdf',
};
const BULETIN_Q4_2025 = {
  dokumen: 'Buletin APBN KiTa Triwulan IV 2025',
  penerbit: 'Kementerian Keuangan',
  tahun_dokumen: 2026,
  url: 'https://media.kemenkeu.go.id/getmedia/b1259fa9-5650-478a-970f-3e7ecb0e4303/Publikasi-APBNKITA-Q4-2025.pdf?ext=.pdf',
};
const BULETIN_Q2_2026 = {
  dokumen: 'Buletin APBN KiTa Triwulan II 2026',
  penerbit: 'Kementerian Keuangan',
  tahun_dokumen: 2026,
  url: 'https://media.kemenkeu.go.id/getmedia/e0a38bd2-c880-45f5-80fc-e67e66523a69/Publikasi-APBNKITA-Q2-2026_v5-1.pdf?ext=.pdf',
};

const UU_APBN_2026 = {
  dokumen: 'Undang-Undang Nomor 17 Tahun 2025 tentang APBN Tahun Anggaran 2026',
  penerbit: 'Pemerintah RI dan DPR (JDIH BPK)',
  tahun_dokumen: 2025,
  url: 'https://peraturan.bpk.go.id/Download/401737/UU%20Nomor%2017%20Tahun%202025.pdf',
};
const DJA_APBN_2026 = {
  dokumen: 'Artikel "APBN 2026: Belanja Prioritas Mewujudkan Kedaulatan Pangan, Energi, dan Ekonomi" (14 Oktober 2025)',
  penerbit: 'Direktorat Jenderal Anggaran, Kementerian Keuangan',
  tahun_dokumen: 2025,
  url: 'https://anggaran.kemenkeu.go.id/in/post/apbn-2026:-belanja-prioritas-mewujudkan-kedaulatan-pangan,-energi,-dan-ekonomi',
};

const baris = (sumber, isi) => ({ satuan: 'Rp triliun', posisi_data: null, tanggal_posisi: null, diperiksa_oleh: ['Ridho Rambu Bassae', 'Nisaa'], tanggal_periksa: '22 Oktober 2026', catatan: null, ...sumber, ...isi });
const SEP_2026 = { posisi_data: 's.d. 30 September 2026', tanggal_posisi: '2026-09-30' };
const DES_2025 = { posisi_data: 's.d. 31 Desember 2025 (sementara)', tanggal_posisi: '2025-12-31' };

export const fakta = [
  // ---------- APBN secara umum, TA 2026 ----------
  baris(KONPERS_OKT, {
    id: 'umum-2026-pendapatan-anggaran', topik: 'umum', pos: 'Pendapatan negara', cakupan: 'pendapatan_negara',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 3153.6, halaman_atau_tabel: 'hlm. 38',
    kutipan: 'PENDAPATAN NEGARA Rp 3.435,1 triliun [...] APBN 2026: Rp3.153,6 triliun',
    catatan: 'Rp3.435,1 triliun adalah APBN 2027; angka TA 2026 adalah baris "APBN 2026".',
  }),
  baris(KONPERS_OKT, {
    id: 'umum-2026-belanja-anggaran', topik: 'umum', pos: 'Belanja negara', cakupan: 'belanja_negara',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 3842.7, halaman_atau_tabel: 'hlm. 38',
    kutipan: 'BELANJA NEGARA Rp 4.106,3 triliun [...] APBN 2026: Rp3.842,7 triliun',
    catatan: 'Rp4.106,3 triliun adalah APBN 2027; angka TA 2026 adalah baris "APBN 2026".',
  }),
  baris(KONPERS_OKT, {
    id: 'umum-2026-defisit-anggaran', topik: 'umum', pos: 'Defisit APBN', cakupan: 'defisit',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 689.1, halaman_atau_tabel: 'hlm. 38',
    kutipan: 'DEFISIT 2,40 % dari PDB [...] APBN 2026: Rp689,1 triliun (2,68% PDB)',
    catatan: '2,40% PDB adalah defisit APBN 2027.',
  }),
  baris(KONPERS_OKT, {
    id: 'umum-2026-pendapatan-realisasi', topik: 'umum', pos: 'Pendapatan negara', cakupan: 'pendapatan_negara',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 2341.5, halaman_atau_tabel: 'hlm. 2',
    kutipan: 'KINERJA APBN PER SEPTEMBER 2026 [...] PENDAPATAN NEGARA Rp2.341,5 T (74,2% dari target)',
  }),
  baris(KONPERS_OKT, {
    id: 'umum-2026-belanja-realisasi', topik: 'umum', pos: 'Belanja negara', cakupan: 'belanja_negara',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 2660.5, halaman_atau_tabel: 'hlm. 2',
    kutipan: 'KINERJA APBN PER SEPTEMBER 2026 [...] BELANJA NEGARA Rp2.660,5 T (69,2% dari pagu)',
  }),
  baris(KONPERS_OKT, {
    id: 'umum-2026-defisit-realisasi', topik: 'umum', pos: 'Defisit APBN', cakupan: 'defisit',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 319.0, halaman_atau_tabel: 'hlm. 2',
    kutipan: 'KINERJA APBN PER SEPTEMBER 2026 [...] DEFISIT APBN Rp319,0 T (-1,24% PDB)',
  }),

  // ---------- Ke mana uang rakyat dipakai: pembagian belanja negara 2026 ----------
  baris(UU_APBN_2026, {
    id: 'umum-2026-bpp-anggaran', topik: 'umum', pos: 'Belanja pemerintah pusat', cakupan: 'belanja_pemerintah_pusat',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 3149.73339076, halaman_atau_tabel: 'hlm. 14, Pasal 8 ayat (1)',
    kutipan: 'Anggaran belanja Pemerintah Pusat sebagaimana dimaksud dalam Pasal 7 huruf a direncanakan sebesar Rp3.149.733.390.760.000,00 (tiga kuadriliun seratus empat puluh sembilan triliun tujuh ratus tiga puluh tiga miliar tiga ratus sembilan puluh juta tujuh ratus enam puluh ribu rupiah)',
    catatan: 'PDF hasil pindai; kutipan diketik ulang dan cocok dengan angka yang ditulis dengan huruf.',
  }),
  baris(UU_APBN_2026, {
    id: 'umum-2026-tkd-anggaran', topik: 'umum', pos: 'Transfer ke daerah (TKD)', cakupan: 'tkd',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 692.994978711, halaman_atau_tabel: 'hlm. 15, Pasal 9 ayat (1)',
    kutipan: 'Anggaran TKD sebagaimana dimaksud dalam Pasal 7 huruf b direncanakan sebesar Rp692.994.978.711.000,00 (enam ratus sembilan puluh dua triliun sembilan ratus sembilan puluh empat miliar sembilan ratus tujuh puluh delapan juta tujuh ratus sebelas ribu rupiah)',
    catatan: 'PDF hasil pindai; kutipan diketik ulang dan cocok dengan angka yang ditulis dengan huruf.',
  }),
  ...[
    ['pelayanan_umum', 'Pelayanan umum', 794.4, 'Fungsi Pelayanan Umum untuk mewujudkan birokrasi dan layanan publik yang berintegritas, produktif, dan profesional dengan alokasi sebesar Rp794,4 triliun'],
    ['ekonomi', 'Ekonomi', 823.7, 'Fungsi Ekonomi untuk mendukung pengembangan teknologi, ketahanan pangan, sarpras transportasi, ketahanan energi, dan UMKM serta koperasi dengan alokasi sebesar Rp823,7 triliun'],
    ['pendidikan', 'Pendidikan', 459.7, 'Fungsi Pendidikan untuk meningkatkan kualitas sumber daya manusia (SDM) yang berdaya saing dengan alokasi sebesar Rp459,7 triliun'],
    ['pertahanan', 'Pertahanan', 337.4, 'Fungsi Pertahanan untuk memenuhi optimum essential force (OEF) untuk mencapai kemampuan pertahanan yang ideal sebagai fondasi kedaulatan bangsa dengan alokasi sebesar Rp337,4 triliun'],
    ['ketertiban_keamanan', 'Ketertiban dan keamanan', 242.6, 'Fungsi Ketertiban dan Keamanan untuk penguatan pemberantasan tindak pidana umum, penanggulangan narkoba, penindakan korupsi, pencegahan terorisme dan penguatan siber dengan alokasi sebesar Rp242,6 triliun'],
    ['perumahan_fasum', 'Perumahan dan fasilitas umum', 28.6, 'Fungsi Perumahan dan Fasilitas Umum untuk Penyediaan perumahan dan kawasan permukiman, pembangunan perkotaan berkelanjutan dengan alokasi sebesar Rp28,6 triliun'],
    ['agama', 'Agama', 14.4, 'Fungsi Agama untuk penguatan pemahaman & pengamalan nilai ajaran agama yg substantif serta praktik beragama yg moderat dan berkarakter toleran.dengan alokasi sebesar Rp14,4 triliun'],
    ['lingkungan_hidup', 'Perlindungan lingkungan hidup', 13.4, 'Fungsi Perlindungan Lingkungan Hidup untuk meningkatkan kualitas lingkungan hidup, pengelolaan keanekaragaman hayati, pengolahan sampah terintegrasi,dan pengelolaan hutan lestari dengan alokasi sebesar Rp13,4 triliun'],
    ['pariwisata', 'Pariwisata', 3.0, 'Fungsi Pariwisata untuk Pengembangan pariwisata dan ekonomi kreatif pada aspek 3 A (atraksi, aksesibilitas, & amenitas) dan 2 P (promosi & pelaku usaha) dengan alokasi sebesar Rp3,0 triliun'],
  ].map(([kunci, nama, nilai, kutipan]) => baris(DJA_APBN_2026, {
    id: `fungsi-${kunci.replace(/_/g, '-')}-2026-anggaran`, topik: 'umum', pos: `Belanja fungsi ${nama.toLowerCase()} (pemerintah pusat)`,
    cakupan: `fungsi_${kunci}`, kelompok: 'belanja_fungsi', jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai, halaman_atau_tabel: null, kutipan,
  })),

  // ---------- Pendidikan ----------
  baris(KONPERS_FEB, {
    id: 'pendidikan-2026-anggaran', topik: 'pendidikan', pos: 'Anggaran pendidikan', cakupan: 'pendidikan_total',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 769.1, halaman_atau_tabel: 'hlm. 27',
    kutipan: 'ANGGARAN PENDIDIKAN Rp56,5 T (7,4% APBN Rp769,1 T)',
    catatan: 'Rp56,5 triliun adalah realisasi s.d. 31 Januari 2026; Rp769,1 triliun adalah anggaran APBN 2026.',
  }),
  baris(KONPERS_OKT, {
    id: 'pendidikan-2026-realisasi-sep', topik: 'pendidikan', pos: 'Anggaran pendidikan', cakupan: 'pendidikan_total',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 574.2, halaman_atau_tabel: 'hlm. 29',
    kutipan: 'ANGGARAN PENDIDIKAN Rp574,2 T s.d. 30 September 2026 [...] Realisasi 2022 s.d. 2026 per 30 September (Triliun Rp)',
    catatan: 'Terdiri atas belanja pemerintah pusat, transfer ke daerah, dan pembiayaan.',
  }),

  // ---------- Kesehatan ----------
  baris(KONPERS_OKT, {
    id: 'kesehatan-2026-realisasi-sep', topik: 'kesehatan', pos: 'Anggaran kesehatan', cakupan: 'kesehatan_total',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 161.8, halaman_atau_tabel: 'hlm. 30',
    kutipan: 'ANGGARAN KESEHATAN 2026 Rp161,8 T s.d. 30 September 2026 [...] Realisasi 2022 s.d. 2026 per 30 September (Triliun Rp)',
  }),

  baris(DJA_APBN_2026, {
    id: 'kesehatan-2026-anggaran-fungsi', topik: 'kesehatan', pos: 'Belanja fungsi kesehatan (pemerintah pusat)', cakupan: 'kesehatan_fungsi_bpp', kelompok: 'belanja_fungsi',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 153.1, halaman_atau_tabel: null,
    kutipan: 'Fungsi Kesehatan untuk mewujudkan SDM sehat, produktif, dan mendukung transformasi sistem kesehatan dengan alokasi sebesar Rp153,1 triliun',
    catatan: 'Hanya belanja pemerintah pusat menurut fungsi, tanpa transfer ke daerah. Cakupannya lebih sempit dari "anggaran kesehatan" yang realisasinya dilaporkan APBN KiTa, jadi keduanya tidak boleh dibagi.',
  }),

  // ---------- Perlindungan sosial ----------
  baris(DJA_APBN_2026, {
    id: 'perlinsos-2026-anggaran-fungsi', topik: 'perlinsos', pos: 'Belanja fungsi perlindungan sosial (pemerintah pusat)', cakupan: 'perlinsos_fungsi_bpp', kelompok: 'belanja_fungsi',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 279.5, halaman_atau_tabel: null,
    kutipan: 'Fungsi Perlindungan Sosial untuk memberikan perlindungan bagi masyarakat miskin dan rentan dari risiko sosial dengan alokasi sebesar Rp279,5 triliun',
    catatan: 'Hanya belanja pemerintah pusat menurut fungsi. Anggaran perlindungan sosial versi Nota Keuangan (termasuk subsidi dan TKD) belum dimuat.',
  }),

  // ---------- Infrastruktur ----------
  baris(KONPERS_FEB, {
    id: 'infrastruktur-2026-anggaran', topik: 'infrastruktur', pos: 'Anggaran pembangunan infrastruktur', cakupan: 'infrastruktur_total',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 434.8, halaman_atau_tabel: 'hlm. 28',
    kutipan: 'PEMBANGUNAN INFRASTRUKTUR 2026 Rp3,7 T (0,9% dari Pagu APBN Rp434,8 T)',
    catatan: 'Rp3,7 triliun adalah realisasi s.d. 31 Januari 2026.',
  }),
  baris(KONPERS_OKT, {
    id: 'infrastruktur-2026-realisasi-sep', topik: 'infrastruktur', pos: 'Anggaran pembangunan infrastruktur', cakupan: 'infrastruktur_total',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 196.0, halaman_atau_tabel: 'hlm. 31',
    kutipan: 'ANGGARAN PEMBANGUNAN INFRASTRUKTUR Rp196,0 T [...] Realisasi 2022 s.d. 2026 per 30 September (Triliun Rp)',
  }),

  // ---------- Subsidi energi ----------
  baris(DJA_APBN_2026, {
    id: 'subsidi-energi-kompensasi-2026-anggaran', topik: 'subsidi_energi', pos: 'Subsidi energi dan kompensasi', cakupan: 'subsidi_energi_kompensasi',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 381.3, halaman_atau_tabel: null,
    kutipan: 'Program Subsidi Energi dan Kompensasi dengan alokasi sebesar Rp381,3 triliun',
    catatan: 'Gabungan subsidi energi dan kompensasi. UU APBN 2026 Pasal 17 hanya menyebut total Program Pengelolaan Subsidi; rinciannya diatur Peraturan Presiden.',
  }),
  baris(BULETIN_Q4_2025, {
    id: 'subsidi-energi-2025-realisasi', topik: 'subsidi_energi', pos: 'Subsidi energi', cakupan: 'subsidi_energi',
    jenis_angka: 'Realisasi', tahun_anggaran: 2025, ...DES_2025, nilai: 185.2, halaman_atau_tabel: 'hlm. 17',
    kutipan: 'Realisasi Belanja Subsidi terdiri atas: (i) Subsidi Energi Rp185,2 triliun, untuk penyaluran BBM bersubsidi 19,0 juta kiloliter, LPG tabung 3 kg sebesar 8,5 juta metrik ton, dan listrik bersubsidi untuk 42,8 juta pelanggan',
    catatan: 'Buletin edisi Triwulan IV 2025: realisasi sementara sepanjang 2025, sebelum audit BPK.',
  }),
  baris(BULETIN_Q2_2026, {
    id: 'subsidi-energi-2026-realisasi-jun', topik: 'subsidi_energi', pos: 'Subsidi energi', cakupan: 'subsidi_energi',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, posisi_data: 's.d. 30 Juni 2026', tanggal_posisi: '2026-06-30', nilai: 78.7, halaman_atau_tabel: 'hlm. 24',
    kutipan: 'Realisasi Belanja Subsidi dan Kompensasi sampai dengan Triwulan II 2026 mencapai Rp233,0 triliun atau 52,1% APBN [...] (1) Subsidi Energi Rp78,7 triliun, yang mencakup Subsidi BBM Rp10,1 triliun, Subsidi LPG Tabung 3 kg Rp30,3 triliun, dan Subsidi Listrik Rp38,3 triliun',
    catatan: 'Tidak termasuk kompensasi BBM dan listrik, yang dicatat terpisah.',
  }),

  // ---------- Penerimaan pajak ----------
  baris(KONPERS_JAN, {
    id: 'pajak-2025-realisasi', topik: 'pajak', pos: 'Penerimaan pajak', cakupan: 'pajak',
    jenis_angka: 'Realisasi', tahun_anggaran: 2025, ...DES_2025, nilai: 1917.6, halaman_atau_tabel: 'hlm. 16',
    kutipan: 'PENERIMAAN PAJAK TAHUN 2025: Rp1.917,6 T',
    catatan: 'Realisasi sementara (dokumen berjudul "Realisasi Sementara APBN 2025").',
  }),
  baris(KONPERS_JAN, {
    id: 'perpajakan-2025-realisasi', topik: 'pajak', pos: 'Penerimaan perpajakan (pajak, bea, dan cukai)', cakupan: 'perpajakan',
    jenis_angka: 'Realisasi', tahun_anggaran: 2025, ...DES_2025, nilai: 2217.9, halaman_atau_tabel: 'hlm. 15',
    kutipan: 'PENERIMAAN PERPAJAKAN: RP2.217,9 T',
    catatan: 'Perpajakan mencakup pajak dalam negeri, bea masuk, bea keluar, dan cukai.',
  }),
  baris(BULETIN_Q2_2026, {
    id: 'pajak-2026-anggaran', topik: 'pajak', pos: 'Penerimaan pajak', cakupan: 'pajak',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 2357.7, halaman_atau_tabel: 'hlm. 15',
    kutipan: 'Sampai dengan Triwulan II, realisasi penerimaan pajak mencapai Rp1.035,7 triliun atau 43,9% dari target APBN sebesar Rp2.357,7 triliun.',
    catatan: 'Untuk penerimaan, "Anggaran" berarti target APBN. Tidak termasuk kepabeanan dan cukai.',
  }),
  baris(UU_APBN_2026, {
    id: 'perpajakan-2026-anggaran', topik: 'pajak', pos: 'Penerimaan perpajakan (pajak, bea, dan cukai)', cakupan: 'perpajakan',
    jenis_angka: 'Anggaran', tahun_anggaran: 2026, nilai: 2693.71425, halaman_atau_tabel: 'hlm. 10, Pasal 4 ayat (1)',
    kutipan: 'Penerimaan Perpajakan sebagaimana dimaksud dalam Pasal 3 huruf a direncanakan sebesar Rp2.693.714.250.000.000,00 (dua kuadriliun enam ratus sembilan puluh tiga triliun tujuh ratus empat belas miliar dua ratus lima puluh juta rupiah)',
    catatan: 'PDF berupa hasil pindai; kutipan diketik ulang dan cocok dengan angka yang ditulis dengan huruf. Nilai dalam rupiah penuh, ditampilkan dalam triliun.',
  }),
  baris(KONPERS_OKT, {
    id: 'pajak-2026-realisasi-sep', topik: 'pajak', pos: 'Penerimaan pajak', cakupan: 'pajak',
    jenis_angka: 'Realisasi', tahun_anggaran: 2026, ...SEP_2026, nilai: 1607.6, halaman_atau_tabel: 'hlm. 16',
    kutipan: 'PENERIMAAN PAJAK S.D. 30 SEPTEMBER 2026 [...] 1.224,3 1.409,0 1.607,6 [...] Jul Agu Sep [...] Realisasi Kumulatif (Rp T)',
    catatan: 'Angka diambil dari grafik realisasi kumulatif; Rp1.607,6 triliun adalah batang bulan September.',
  }),
];

// Contoh penggunaan dana yang disebut dokumen (bagian "Untuk apa dananya").
const guna = (sumber, isi) => ({ ...sumber, ...isi });
export const kegunaan = [
  guna(KONPERS_OKT, { topik: 'pendidikan', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 29',
    teks: 'Program Indonesia Pintar (PIP) Rp11,2 T untuk 16 juta siswa', kutipan: 'Penyaluran PIP Rp11,2 T untuk 16 juta siswa' }),
  guna(KONPERS_OKT, { topik: 'pendidikan', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 29',
    teks: 'KIP Kuliah Rp14,8 T untuk 878 ribu mahasiswa', kutipan: 'Penyaluran KIP Kuliah Rp14,8 T untuk 878 ribu mahasiswa' }),
  guna(KONPERS_OKT, { topik: 'pendidikan', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 29',
    teks: 'Dana BOS Rp52,8 T untuk 43,7 juta siswa, lewat transfer ke daerah', kutipan: 'MELALUI TKD Rp228,1 T [...] BOS Rp52,8 T untuk 43,7 juta siswa' }),
  guna(KONPERS_OKT, { topik: 'kesehatan', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 30',
    teks: 'Bantuan iuran PBI JKN Rp34,7 T untuk 96,7 juta orang', kutipan: 'Penyaluran bantuan iuran PBI JKN Rp34,7 T (96,7 juta orang)' }),
  guna(KONPERS_OKT, { topik: 'kesehatan', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 30',
    teks: 'Pemeriksaan Kesehatan Gratis Rp555,0 M untuk 105,1 juta orang', kutipan: 'Pemeriksaan Kesehatan Gratis Rp555,0 M (105,1 juta orang)' }),
  guna(DJA_APBN_2026, { topik: 'perlinsos', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Program Keluarga Harapan (PKH) dialokasikan Rp28,7 triliun', kutipan: 'Program Keluarga Harapan (PKH) dengan alokasi sebesar Rp28,7 triliun' }),
  guna(DJA_APBN_2026, { topik: 'perlinsos', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Kartu Sembako (BPNT) dialokasikan Rp43,8 triliun', kutipan: 'Pogram Kartu Sembako (BPNT) dengan alokasi sebesar Rp43,8 triliun' }),
  guna(DJA_APBN_2026, { topik: 'kesehatan', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Bantuan iuran jaminan kesehatan dialokasikan Rp69,0 triliun', kutipan: 'Program Bantuan Iuran Jaminan Kesehatan dengan alokasi sebesar Rp69,0 triliun' }),
  guna(KONPERS_OKT, { topik: 'infrastruktur', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 31',
    teks: 'Pembangunan dan preservasi jalan Rp19,4 T', kutipan: 'Pembangunan dan preservasi jalan Rp19,4 T (progress 37,2rb km)' }),
  guna(KONPERS_OKT, { topik: 'infrastruktur', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 31',
    teks: 'Pembangunan jalan tol Rp4,4 T', kutipan: 'Pembangunan jalan tol Rp4,4 T (progress 17,7 km)' }),
  guna(BULETIN_Q2_2026, { topik: 'subsidi_energi', tahun_anggaran: 2026, halaman_atau_tabel: 'hlm. 24',
    teks: 'Subsidi BBM Rp10,1 triliun, LPG tabung 3 kg Rp30,3 triliun, dan listrik Rp38,3 triliun',
    kutipan: 'Subsidi Energi Rp78,7 triliun, yang mencakup Subsidi BBM Rp10,1 triliun, Subsidi LPG Tabung 3 kg Rp30,3 triliun, dan Subsidi Listrik Rp38,3 triliun' }),
  guna(BULETIN_Q4_2025, { topik: 'subsidi_energi', tahun_anggaran: 2025, halaman_atau_tabel: 'hlm. 17',
    teks: 'BBM bersubsidi 19,0 juta kiloliter, LPG 3 kg 8,5 juta metrik ton, dan listrik bersubsidi untuk 42,8 juta pelanggan',
    kutipan: 'untuk penyaluran BBM bersubsidi 19,0 juta kiloliter, LPG tabung 3 kg sebesar 8,5 juta metrik ton, dan listrik bersubsidi untuk 42,8 juta pelanggan' }),
  guna(DJA_APBN_2026, { topik: 'umum', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Program prioritas yang manfaatnya langsung diterima masyarakat dialokasikan Rp1.377,9 triliun', kutipan: 'Pada tahun 2026, Pemerintah tetap berkomitmen untuk menjalankan program-program prioritas untuk meningkatkan kesejahteraan rakyat, dengan alokasi anggaran sebesar Rp1.377,9 triliun' }),
  guna(DJA_APBN_2026, { topik: 'umum', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Makan Bergizi Gratis (MBG) dialokasikan Rp335,0 triliun', kutipan: 'Program Makan Bergizi Gratis dengan alokasi sebesar Rp335,0 triliun' }),
  guna(DJA_APBN_2026, { topik: 'umum', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Koperasi Desa/Kelurahan Merah Putih dialokasikan Rp83 triliun', kutipan: 'Program Koperasi desa/kelurahan Merah Putih dengan alokasi anggaran sebesar Rp83 triliun' }),
  guna(DJA_APBN_2026, { topik: 'pendidikan', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'PIP, KIP Kuliah, dan beasiswa lain dialokasikan Rp63,8 triliun', kutipan: 'Program PIP/KIP Kuliah/Beasiswa lainnya dengan alokasi sebesar Rp63,8 triliun' }),
  guna(DJA_APBN_2026, { topik: 'subsidi_energi', tahun_anggaran: 2026, halaman_atau_tabel: null,
    teks: 'Subsidi energi dan kompensasi dialokasikan Rp381,3 triliun', kutipan: 'Program Subsidi Energi dan Kompensasi dengan alokasi sebesar Rp381,3 triliun' }),
].map((k, i) => ({ id: `guna-${i + 1}`, ...k }));
