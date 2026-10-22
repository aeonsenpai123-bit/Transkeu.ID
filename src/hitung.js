// Semua angka dan perhitungan di Transkeu.ID lewat sini, bukan lewat model bahasa.

// Format Indonesia: titik pemisah ribuan, koma desimal. Ditulis manual agar hasil sama di semua browser.
export function formatAngka(nilai, desimal = 1) {
  const [bulat, pecahan] = Math.abs(nilai).toFixed(desimal).split('.');
  const ribuan = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const teks = pecahan && Number(pecahan) !== 0 ? `${ribuan},${pecahan.replace(/0+$/, '')}` : ribuan;
  return nilai < 0 ? `-${teks}` : teks;
}

// "Rp769,1 triliun" / "52,3 persen"
export function formatNilai(baris) {
  if (baris.satuan === 'persen') return `${formatAngka(baris.nilai, 2)} persen`;
  const kata = baris.satuan.replace(/^Rp\s*/, '');
  return `Rp${formatAngka(baris.nilai, 2)} ${kata}`;
}

// Persentase realisasi = Realisasi / Anggaran × 100%.
// Hanya dihitung bila tahun, cakupan pos, dan satuan sama. Selain itu null: lebih baik tidak ada angka daripada angka keliru.
export function persenRealisasi(realisasi, anggaran) {
  if (!realisasi || !anggaran) return null;
  if (realisasi.jenis_angka !== 'Realisasi' || anggaran.jenis_angka !== 'Anggaran') return null;
  if (realisasi.tahun_anggaran !== anggaran.tahun_anggaran) return null;
  if (realisasi.cakupan !== anggaran.cakupan) return null;
  if (realisasi.satuan !== anggaran.satuan || realisasi.satuan === 'persen') return null;
  if (!(anggaran.nilai > 0)) return null;

  const hasil = (realisasi.nilai / anggaran.nilai) * 100;
  return {
    hasil,
    teksHasil: `${formatAngka(hasil, 1)} persen`,
    rumus: `${formatNilai(realisasi)} ÷ ${formatNilai(anggaran)} × 100% = ${formatAngka(hasil, 1)} persen`,
    keterangan: `Realisasi ${realisasi.posisi_data} dibagi Anggaran TA ${anggaran.tahun_anggaran}, cakupan pos sama (${anggaran.pos}).`,
  };
}
