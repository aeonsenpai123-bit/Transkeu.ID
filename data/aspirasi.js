// Modul Aspirasi Berbasis Data: Membantu warga menyusun draf aspirasi publik yang santun,
// terstruktur, dan berbasis data resmi APBN untuk dikirimkan secara mandiri ke kanal resmi pemerintah.
// Transkeu.ID TIDAK mengirimkan aspirasi secara otomatis.

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

export function susunDrafAspirasi({ topik, masalah, dataPendukung, masukan, lokasi, namaInisial = 'Warga Pembayar Pajak' }) {
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return `Yth. Pengelola Layanan Publik / Komisi Terkait DPR RI,

Perihal: Aspirasi Masyarakat Terkait Kebijakan & Layanan ${topik}

Dengan hormat,
Saya yang bertanda tangan di bawah ini (${namaInisial}${lokasi ? `, domisili: ${lokasi}` : ''}), bermaksud menyampaikan aspirasi dan masukan konstruktif demi perbaikan layanan publik:

1. Permasalahan yang Dihadapi di Lapangan:
${masalah.trim()}

2. Rujukan Data APBN / Dokumen Resmi Terkait:
${dataPendukung ? dataPendukung.trim() : 'Berdasarkan rujukan keterbukaan informasi publik APBN TA 2026 (Transkeu.ID).'}

3. Masukan / Usulan Perbaikan yang Diharapkan:
${masukan.trim()}

Demikian aspirasi ini disusun secara objektif dan beritikad baik untuk mendukung efektivitas dan transparansi pengelolaan uang rakyat. Besar harapan kami hal ini dapat menjadi bahan perhatian dan evaluasi bersama.

Terima kasih.
Hormat saya,

${namaInisial}
(Disusun mandiri via Transkeu.ID · ${tanggal})`;
}
