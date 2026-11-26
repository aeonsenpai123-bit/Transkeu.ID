// Kamus istilah (PRD F4). Penjelasan sederhana, sinonim, singkatan, contoh membaca angka, dan pencarian toleran salah ketik.
export const istilah = [
  {
    istilah: 'Pagu',
    alias: ['pagu anggaran'],
    sinonim: ['plafon', 'batas anggaran', 'batas belanja', 'alokasi awal'],
    arti: 'Batas tertinggi anggaran yang boleh dibelanjakan untuk suatu pos, program, atau instansi dalam satu tahun anggaran.',
    contoh: 'Contoh membaca: "Pagu awal Kemendikdasmen TA 2026 sebesar Rp56,68 triliun" berarti batas maksimal belanja awal kementerian tersebut menurut UU APBN, belum tentu semuanya sudah dibelanjakan.',
    terkait: ['Anggaran', 'Realisasi', 'Belanja K/L'],
  },
  {
    istilah: 'Realisasi',
    alias: ['penyerapan', 'realisasi belanja'],
    sinonim: ['sudah dipakai', 'terserap', 'terpakai', 'capaian anggaran', 'pencairan'],
    arti: 'Uang yang benar-benar sudah dibelanjakan atau diterima sampai tanggal posisi tertentu. Selalu periksa tanggal posisi datanya agar tidak dianggap angka akhir tahun.',
    contoh: 'Contoh membaca: "Realisasi PIP s.d. 30 September 2026 sebesar Rp11,2 triliun" berarti dana yang sudah disalurkan dari 1 Januari sampai 30 September 2026, bukan angka sepanjang tahun penuh.',
    terkait: ['Tanggal Posisi', 'Pagu', 'Output'],
  },
  {
    istilah: 'Tanggal Posisi',
    alias: ['posisi data', 'cutoff'],
    sinonim: ['per tanggal', 'sampai dengan', 's.d.', 'periode data'],
    arti: 'Tanggal batas pencatatan angka realisasi atau output. Angka realisasi bersifat kumulatif dari 1 Januari hingga tanggal posisi tersebut dan akan terus berubah hingga tutup tahun.',
    contoh: 'Contoh membaca: "s.d. 30 September 2026" artinya pencatatan mencakup Januari–September 2026, sehingga tidak boleh dibandingkan mentah-mentah dengan periode Juni tanpa penyesuaian.',
    terkait: ['Realisasi', 'Outlook', 'APBN KiTa'],
  },
  {
    istilah: 'Outlook',
    alias: ['prognosis'],
    sinonim: ['perkiraan akhir tahun', 'proyeksi realisasi'],
    arti: 'Perkiraan pemerintah mengenai hasil akhir anggaran sampai 31 Desember, dihitung dari realisasi yang sudah terjadi ditambah perkiraan sisa bulan berjalan.',
    contoh: 'Contoh membaca: jika realisasi Semester I sudah dicatat, outlook Semester II memperkirakan total belanja sampai akhir tahun. Outlook bukan pagu UU dan bukan angka final audit BPK.',
    terkait: ['Prognosis', 'Realisasi', 'Anggaran'],
  },
  {
    istilah: 'Belanja Pemerintah Pusat',
    alias: ['BPP'],
    sinonim: ['belanja pusat', 'pengeluaran pusat'],
    arti: 'Bagian belanja APBN yang dikelola langsung oleh kementerian/lembaga pusat serta Bendahara Umum Negara (di luar dana yang ditransfer ke pemerintah daerah).',
    contoh: 'Contoh membaca: di UU APBN 2026, Belanja Pemerintah Pusat direncanakan Rp3.149,73 triliun, lalu ditambah TKD Rp692,99 triliun menjadi total Belanja Negara Rp3.842,7 triliun.',
    terkait: ['TKD', 'Belanja K/L', 'Belanja Non-K/L'],
  },
  {
    istilah: 'TKD',
    alias: ['transfer ke daerah'],
    sinonim: ['dana transfer', 'dau', 'dak', 'dana desa', 'dana bos daerah'],
    arti: 'Transfer ke Daerah: dana dari APBN pemerintah pusat yang dikirimkan ke pemerintah provinsi, kabupaten/kota, desa, atau rekening sekolah (seperti BOS) untuk membiayai layanan publik daerah.',
    contoh: 'Contoh membaca: Dana BOS sebesar Rp52,8 triliun s.d. 30 September 2026 dicatat sebagai penyaluran melalui TKD, sehingga tidak masuk di pagu satu kementerian saja.',
    terkait: ['Belanja Pemerintah Pusat', 'BOS', 'Anggaran'],
  },
  {
    istilah: 'Subsidi',
    alias: ['belanja subsidi'],
    sinonim: ['subsidi energi', 'subsidi bbm', 'subsidi lpg', 'subsidi listrik', 'bantuan harga'],
    arti: 'Bantuan pemotongan harga dari APBN agar barang atau jasa penting (misalnya BBM, LPG tabung 3 kg, listrik, pupuk) tetap terjangkau oleh masyarakat.',
    contoh: 'Contoh membaca: Realisasi Subsidi Energi s.d. 30 Juni 2026 sebesar Rp78,7 triliun (BBM Rp10,1 T, LPG 3 kg Rp30,3 T, Listrik Rp38,3 T) — dicatat terpisah dari pos Kompensasi.',
    terkait: ['Kompensasi', 'Belanja Non-K/L'],
  },
  {
    istilah: 'Kompensasi',
    alias: ['kompensasi energi'],
    sinonim: ['pembayaran selisih harga', 'kompensasi bumn'],
    arti: 'Pembayaran pemerintah kepada BUMN energi (seperti Pertamina dan PLN) atas selisih antara harga jual yang ditetapkan pemerintah dan harga formula keekonomian. Dicatat terpisah dari subsidi.',
    contoh: 'Contoh membaca: Pagu "Subsidi Energi dan Kompensasi Rp381,3 triliun" tidak boleh dibagi dengan realisasi "Subsidi Energi Rp78,7 triliun" saja karena pos kompensasi belum masuk di realisasi tersebut.',
    terkait: ['Subsidi', 'Beda Subsidi dan Kompensasi'],
  },
  {
    istilah: 'Output',
    alias: ['capaian output', 'keluaran'],
    sinonim: ['hasil fisik', 'jumlah penerima', 'volume tersalurkan'],
    arti: 'Keluaran fisik langsung atau jumlah penerima yang tercapai dari belanja anggaran, misalnya jumlah siswa penerima PIP, kilometer jalan dibangun, atau juta pelanggan listrik.',
    contoh: 'Contoh membaca: "Penyaluran PIP Rp11,2 T untuk 16 juta siswa" menunjukkan dua hal: realisasi kas Rp11,2 T dan output fisik 16 juta siswa. Output tinggi belum otomatis membuktikan dampak belajar meningkat.',
    terkait: ['Dampak', 'Realisasi', 'PIP'],
  },
  {
    istilah: 'Dampak',
    alias: ['impact', 'outcome'],
    sinonim: ['manfaat jangka panjang', 'perubahan kondisi masyarakat', 'evaluasi dampak'],
    arti: 'Perubahan nyata pada kondisi masyarakat akibat suatu program (misalnya turunnya angka putus sekolah atau membaiknya hasil belajar), yang hanya bisa disimpulkan lewat riset evaluasi khusus.',
    contoh: 'Contoh membaca: Jika laporan hanya memuat serapan Rp11,2 T dan 16 juta penerima PIP tanpa studi pembanding/evaluasi, maka status di Transkeu.ID adalah "Bukti dampak belum tersedia".',
    terkait: ['Output', 'Realisasi', 'LKPP'],
  },
  { istilah: 'Beda Anggaran dan Realisasi', alias: ['beda anggaran dan realisasi', 'perbedaan anggaran dan realisasi', 'beda anggaran dengan realisasi'], arti: 'Anggaran adalah rencana batas belanja yang disetujui UU APBN (belum tentu sudah dibelanjakan). Realisasi adalah uang yang benar-benar sudah dibelanjakan atau diterima sampai tanggal posisi tertentu.' },
  { istilah: 'Beda Subsidi dan Kompensasi', alias: ['beda subsidi dan kompensasi', 'perbedaan subsidi dan kompensasi', 'beda subsidi dengan kompensasi'], arti: 'Subsidi adalah bantuan pemotongan harga langsung ke komoditas (misalnya BBM, LPG, listrik). Kompensasi adalah pembayaran pemerintah kepada BUMN energi atas selisih harga formula keekonomian dengan harga jual yang ditetapkan pemerintah.' },
  { istilah: 'Beda Anggaran Pendidikan dan Kemendikdasmen', alias: ['beda anggaran pendidikan dengan anggaran kemendikdasmen', 'beda anggaran pendidikan dan kemendikdasmen'], arti: 'Anggaran pendidikan adalah alokasi 20 persen APBN (Rp769,1 T di 2026) yang dibagi ke belanja kementerian/lembaga pusat, transfer ke daerah (BOS), dan dana abadi pendidikan. Sedangkan Kemendikdasmen hanyalah salah satu kementerian yang mengelola sebagian dari belanja pendidikan pusat.' },
  { istilah: 'Beda Belanja Pusat dan TKD', alias: ['beda belanja pusat dan tkd', 'beda pusat dan tkd'], arti: 'Belanja Pemerintah Pusat (BPP) dikelola langsung oleh kementerian/lembaga negara, sedangkan Transfer ke Daerah (TKD) disalurkan ke pemerintah provinsi, kabupaten, dan kota untuk membiayai layanan publik daerah.' },
  { istilah: 'APBN', sinonim: ['anggaran negara', 'keuangan negara'], arti: 'Anggaran Pendapatan dan Belanja Negara: rencana keuangan tahunan pemerintah pusat yang disetujui DPR dan ditetapkan dengan undang-undang.' },
  { istilah: 'Tahun Anggaran', alias: ['TA'], arti: 'Masa berlaku APBN, yaitu 1 Januari sampai 31 Desember tahun yang sama.' },
  { istilah: 'Anggaran', sinonim: ['rencana belanja', 'target penerimaan'], arti: 'Rencana uang yang boleh dipakai untuk suatu keperluan dalam satu tahun anggaran. Ini rencana, belum tentu sudah dibelanjakan.' },
  { istilah: 'Prognosis', arti: 'Perkiraan realisasi untuk sisa periode, misalnya semester II. Sering dipakai bersama outlook.' },
  { istilah: 'Semester', arti: 'Setengah tahun. Semester I berarti Januari sampai Juni.' },
  { istilah: 'Pendapatan Negara', arti: 'Semua uang yang masuk ke kas negara: penerimaan perpajakan, PNBP, dan hibah.' },
  { istilah: 'Penerimaan Perpajakan', alias: ['perpajakan'], arti: 'Penerimaan dari pajak dalam negeri, bea masuk, bea keluar, dan cukai.' },
  { istilah: 'PNBP', arti: 'Penerimaan Negara Bukan Pajak, misalnya dari sumber daya alam, layanan instansi, dan dividen BUMN.' },
  { istilah: 'Hibah', arti: 'Pemberian kepada negara dari pihak lain yang tidak perlu dibayar kembali.' },
  { istilah: 'Belanja Negara', sinonim: ['pengeluaran negara'], arti: 'Seluruh pengeluaran APBN: belanja pemerintah pusat ditambah transfer ke daerah.' },
  { istilah: 'Belanja K/L', alias: ['kementerian/lembaga', 'k/l'], arti: 'Belanja yang dikelola langsung oleh kementerian atau lembaga, misalnya untuk gaji, barang, dan pembangunan.' },
  { istilah: 'Belanja Non-K/L', alias: ['bun'], arti: 'Belanja yang dikelola Bendahara Umum Negara, misalnya subsidi, pembayaran bunga utang, dan pensiun.' },
  { istilah: 'Defisit', arti: 'Keadaan ketika belanja negara lebih besar dari pendapatan negara. Selisihnya ditutup dengan pembiayaan.' },
  { istilah: 'Pembiayaan', arti: 'Cara menutup defisit atau memakai surplus, misalnya lewat penerbitan surat berharga negara dan pinjaman.' },
  { istilah: 'Keseimbangan Primer', arti: 'Pendapatan negara dikurangi belanja negara di luar pembayaran bunga utang.' },
  { istilah: 'SiLPA', arti: 'Sisa Lebih Pembiayaan Anggaran: kelebihan dana pembiayaan dibanding yang dibutuhkan untuk menutup defisit.' },
  { istilah: 'Bantuan Sosial', alias: ['bansos'], arti: 'Uang atau barang dari pemerintah untuk melindungi warga dari risiko sosial, misalnya PKH dan Kartu Sembako.' },
  { istilah: 'Perlindungan Sosial', alias: ['perlinsos'], arti: 'Kumpulan program untuk melindungi warga rentan, termasuk bantuan sosial, subsidi, dan jaminan sosial.' },
  { istilah: 'PKH', alias: ['program keluarga harapan'], arti: 'Program Keluarga Harapan: bantuan uang bersyarat untuk keluarga miskin dan rentan.' },
  { istilah: 'PBI JKN', alias: ['bpjs pbi'], arti: 'Penerima Bantuan Iuran Jaminan Kesehatan Nasional: iuran BPJS Kesehatan warga tidak mampu yang dibayar pemerintah.' },
  { istilah: 'PIP', alias: ['program indonesia pintar'], sinonim: ['kartu pintar sekolah', 'beasiswa siswa'], arti: 'Program Indonesia Pintar: bantuan biaya pendidikan tunai untuk siswa dari keluarga kurang mampu atau rentan.', contoh: 'Contoh membaca: s.d. 30 September 2026, realisasi PIP tercatat Rp11,2 triliun untuk 16 juta siswa (APBN KiTa Okt 2026 hlm. 29).', terkait: ['Pagu', 'Realisasi', 'Output'] },
  { istilah: 'KIP Kuliah', alias: ['kartu indonesia pintar kuliah'], arti: 'Kartu Indonesia Pintar Kuliah: bantuan biaya kuliah dan biaya hidup untuk mahasiswa dari keluarga kurang mampu.' },
  { istilah: 'BOS', alias: ['bantuan operasional sekolah'], arti: 'Bantuan Operasional Sekolah: dana untuk biaya operasional sekolah, disalurkan lewat transfer ke daerah.' },
  { istilah: 'Mandatory Spending', alias: ['belanja wajib'], arti: 'Belanja yang porsinya diwajibkan peraturan. Contoh: UUD 1945 Pasal 31 ayat (4) mewajibkan anggaran pendidikan paling sedikit 20 persen dari APBN dan APBD.' },
  { istilah: 'Nota Keuangan', arti: 'Dokumen pemerintah yang menjelaskan isi RAPBN atau APBN, termasuk rincian per fungsi dan programnya.' },
  { istilah: 'LKPP', arti: 'Laporan Keuangan Pemerintah Pusat: laporan pertanggungjawaban APBN satu tahun yang diperiksa BPK.' },
  { istilah: 'Opini WTP', alias: ['WTP'], arti: 'Wajar Tanpa Pengecualian: opini terbaik dari BPK, artinya laporan keuangan disajikan wajar. Opini ini bukan penilaian bahwa tidak ada pemborosan atau korupsi.' },
  { istilah: 'APBN KiTa', arti: 'Laporan bulanan Kementerian Keuangan tentang kinerja dan realisasi APBN.' },
];

// Jarak edit sederhana untuk toleransi salah ketik di kamus offline.
function jarakEdit(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

export function cariKamus(daftar, query) {
  const q = String(query ?? '').toLowerCase().trim();
  if (!q) return daftar;
  const tokens = q.split(/\s+/).filter(Boolean);
  return daftar
    .map((item) => {
      const kataKunci = [item.istilah, ...(item.alias ?? []), ...(item.sinonim ?? [])].map((s) => s.toLowerCase());
      const isi = `${item.arti} ${item.contoh ?? ''}`.toLowerCase();
      let skorKata = 0;
      for (const k of kataKunci) {
        let s = 0;
        if (k === q) s = 30;
        else if (k.startsWith(q)) s = 18;
        else if (k.includes(q)) s = 12;
        else if (tokens.every((t) => k.includes(t))) s = 9;
        else if (q.length >= 4) {
          const parts = k.split(/\s+/);
          for (const part of parts) {
            if (part.length >= 4) {
              const d = jarakEdit(q, part);
              if (d <= 1) s = Math.max(s, parts.length === 1 ? 10 : 7);
              else if (d === 2 && q.length >= 6) s = Math.max(s, parts.length === 1 ? 6 : 4);
            }
          }
        }
        if (s > skorKata) skorKata = s;
      }
      const skorIsi = isi.includes(q) ? 3 : (tokens.length > 1 && tokens.every((t) => isi.includes(t)) ? 2 : 0);
      return { item, skor: skorKata + skorIsi };
    })
    .filter((r) => r.skor > 0)
    .sort((a, b) => b.skor - a.skor)
    .map((r) => r.item);
}
