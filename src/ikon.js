// Ikon SVG garis 2px, satu gaya (pedoman ui-ux-pro-max: tanpa emoji, satu keluarga ikon).
// Selalu dekoratif di samping teks, jadi aria-hidden.
const jalur = {
  tutup: '<path d="M6 6l12 12M18 6L6 18"/>',
  keluar: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  kirim: '<path d="M4 12l16-8-6 16-3-7-7-1z"/>',
  dokumen: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  hitung: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  daftar: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  tanya: '<path d="M4 5h16v11H9l-5 4z"/>',
  topik: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  kamus: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  kuis: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  jempol: '<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7"/>',
  bendera: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  peringatan: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  panah: '<path d="M9 6l6 6-6 6"/>',
  beranda: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
  kilau: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  masuk: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  belanja: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  kurang: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  sekolah: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/>',
  hati: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
  tangan: '<path d="M4 14l4-1 5 2 4-2a1.5 1.5 0 0 1 2 2l-6 4-6-1H4z"/><circle cx="14" cy="6" r="3"/>',
  jalan: '<path d="M8 3L4 21M16 3l4 18M12 4v2M12 10v3M12 17v3"/>',
  api: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-3 0-5z"/>',
  koin: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  gedung: '<path d="M3 21h18M5 21V10M19 21V10M9 21v-6h6v6M2 10l10-6 10 6z"/>',
  peta: '<path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2z"/><path d="M9 4v14M15 6v14"/>',
};

export function ikon(nama, kelas = '') {
  const t = document.createElement('template');
  t.innerHTML = `<svg class="ikon ${kelas}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${jalur[nama]}</svg>`;
  return t.content.firstChild;
}
