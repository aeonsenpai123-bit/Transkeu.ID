// Enam topik versi awal (PRD F3), ditambah "umum" untuk total APBN yang tidak tampil sebagai kartu.
// Urutan penting: topik pertama yang kata kuncinya cocok yang dipakai.
export const topik = [
  {
    id: 'pendidikan',
    nama: 'Pendidikan',
    kata_kunci: ['pendidikan', 'sekolah', 'guru', 'pip', 'kip', 'kip kuliah', 'bos', 'beasiswa', 'kampus', 'kuliah'],
    contoh: ['Berapa anggaran pendidikan 2026 dan sudah dipakai berapa?', 'Anggaran pendidikan 2025 berapa?', 'Untuk apa saja anggaran pendidikan?'],
    batasan: 'Anggaran pendidikan disalurkan lewat belanja pemerintah pusat, transfer ke daerah, dan pembiayaan, jadi tidak sama dengan anggaran satu kementerian.',
  },
  {
    id: 'kesehatan',
    nama: 'Kesehatan',
    kata_kunci: ['kesehatan', 'bpjs', 'jkn', 'rumah sakit', 'puskesmas', 'kemenkes'],
    contoh: ['Berapa anggaran kesehatan 2026?', 'Anggaran kesehatan sudah terpakai berapa?', 'Anggaran kesehatan 2025 berapa?'],
    batasan: 'Anggaran kesehatan mencakup belanja pusat dan transfer ke daerah, bukan hanya Kementerian Kesehatan.',
  },
  {
    id: 'perlinsos',
    nama: 'Perlindungan Sosial',
    kata_kunci: ['perlindungan sosial', 'perlinsos', 'bansos', 'bantuan sosial', 'pkh', 'sembako', 'kartu sembako', 'bantuan'],
    contoh: ['Berapa anggaran perlindungan sosial 2026?', 'Anggaran bansos sudah dipakai berapa?', 'Anggaran perlindungan sosial 2025 berapa?'],
    batasan: null,
  },
  {
    id: 'infrastruktur',
    nama: 'Infrastruktur',
    kata_kunci: ['infrastruktur', 'jalan', 'jembatan', 'bendungan', 'tol', 'irigasi'],
    contoh: ['Berapa anggaran infrastruktur 2026?', 'Anggaran infrastruktur 2025 berapa?', 'Anggaran infrastruktur sudah terpakai berapa?'],
    batasan: null,
  },
  {
    id: 'subsidi_energi',
    nama: 'Subsidi Energi',
    kata_kunci: ['subsidi energi', 'subsidi bbm', 'subsidi listrik', 'bbm', 'lpg', 'elpiji', 'listrik', 'solar', 'pertalite'],
    contoh: ['Berapa subsidi energi 2026?', 'Subsidi energi 2025 berapa?', 'Subsidi energi sudah terpakai berapa?'],
    batasan: 'Subsidi energi berbeda dengan kompensasi energi; keduanya dicatat terpisah.',
  },
  {
    id: 'pajak',
    nama: 'Penerimaan Pajak',
    kata_kunci: ['pajak', 'perpajakan', 'ppn', 'pph', 'penerimaan pajak'],
    contoh: ['Berapa target penerimaan pajak 2026?', 'Penerimaan pajak sudah berapa?', 'Target penerimaan pajak 2025 berapa?'],
    batasan: 'Untuk penerimaan, "Anggaran" berarti target yang ditetapkan APBN.',
  },
  {
    id: 'umum',
    nama: 'APBN secara umum',
    kata_kunci: ['apbn', 'belanja negara', 'pendapatan negara', 'defisit', 'utang', 'pembiayaan'],
    contoh: [],
    batasan: null,
    tersembunyi: true,
  },
];

export const contohAwal = [
  'Pajak yang kita bayar dipakai buat apa?',
  'Anggaran pendidikan 2026 sudah terpakai berapa?',
  'Kenapa APBN bisa defisit?',
  'Apa beda anggaran dan realisasi?',
];
