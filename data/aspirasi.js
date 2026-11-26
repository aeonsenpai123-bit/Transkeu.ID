// Modul Aspirasi Berbasis Data: Membantu warga/siswa menyusun draf aspirasi publik yang santun,
// terstruktur, dan berbasis data resmi APBN untuk dikirimkan secara mandiri ke kanal resmi pemerintah.
// Transkeu.ID TIDAK mengirimkan aspirasi secara otomatis dan tidak menyimpan isi draf di server.

export const PERINGATAN_PRIVASI_ASPIRASI =
  'Demi keamanan data pribadi (terutama bagi pelajar/mahasiswa), jangan menuliskan NIK, alamat rumah lengkap, nomor telepon pribadi, atau nama siswa lain di dalam draf.';

export const kanalResmi = [
  {
    id: 'lapor',
    nama: 'SP4N-LAPOR!',
    instansi: 'KemenPANRB, KSP, Kemendagri, Ombudsman RI',
    kegunaan: 'Kanal Pengaduan Pelayanan Publik Nasional terpadu untuk seluruh kementerian, lembaga, dan pemerintah daerah.',
    url: 'https://www.lapor.go.id/',
  },
  {
    id: 'dpr',
    nama: 'Portal Aspirasi DPR RI',
    instansi: 'Dewan Perwakilan Rakyat Republik Indonesia',
    kegunaan: 'Penyampaian aspirasi kebijakan dan pengawasan pelaksanaan undang-undang anggaran kepada Komisi terkait di DPR.',
    url: 'https://www.dpr.go.id/',
  },
  {
    id: 'kemenkeu',
    nama: 'Hubungi Kami / Pengaduan Kemenkeu (WISE)',
    instansi: 'Kementerian Keuangan Republik Indonesia',
    kegunaan: 'Layanan aspirasi, informasi publik PPID, dan pelaporan tata kelola anggaran dan perbendaharaan negara.',
    url: 'https://www.kemenkeu.go.id/hubungi-kami',
  },
  {
    id: 'ombudsman',
    nama: 'Ombudsman Republik Indonesia',
    instansi: 'Ombudsman RI',
    kegunaan: 'Pengaduan dugaan maladministrasi, penundaan berlarut, atau diskriminasi dalam penyaluran layanan publik bersumber APBN.',
    url: 'https://ombudsman.go.id/',
  },
];

export function susunDrafAspirasi({
  topik,
  masalah,
  dataPendukung,
  batasBukti,
  masukan,
  lokasi,
  namaInisial = 'Warga / Pelajar Peduli APBN',
}) {
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const batasDefault =
    'Data APBN di atas merupakan data nasional sesuai tahun anggaran dan tanggal posisi dokumen. Angka serapan atau pagu nasional belum membuktikan kondisi pelaksanaan di satu sekolah atau daerah tertentu tanpa pemeriksaan lapangan tersendiri.';

  return `Yth. Pengelola Layanan Publik / Komisi Terkait DPR RI,

Perihal: Aspirasi Masyarakat Terkait Kebijakan & Layanan ${topik}

Dengan hormat,
Saya yang bertanda tangan di bawah ini (${namaInisial}${lokasi ? `, wilayah umum: ${lokasi}` : ''}), bermaksud menyampaikan aspirasi dan masukan konstruktif berbasis bukti data APBN:

1. Masalah yang Dialami:
${masalah.trim()}

2. Bukti Data APBN & Sumber Resmi:
${dataPendukung ? dataPendukung.trim() : 'Belum ada dokumen pendukung yang dipilih. Mohon informasi resmi dan rincian dokumen dari instansi terkait.'}

3. Batas Bukti:
${batasBukti && batasBukti.trim() ? batasBukti.trim() : batasDefault}

4. Usulan Perbaikan:
${masukan.trim()}

Demikian aspirasi ini disusun secara objektif dan beritikad baik untuk mendukung transparansi dan kualitas layanan publik. Dokumen ini disusun mandiri oleh pengguna dan tidak dikirimkan otomatis oleh aplikasi.

Terima kasih.
Hormat saya,

${namaInisial}
(Disusun mandiri offline/lokal via Transkeu.ID · ${tanggal})`;
}
