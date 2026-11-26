// Pengelola Paket Belajar Offline & PWA Transkeu.ID.
// Memastikan pembaruan bersifat atomik (staging -> aktif) agar pembaruan yang terputus tidak merusak paket lama,
// serta menjaga skor kuis dan draf aspirasi di localStorage terpisah dari Cache Storage.

export const PAKET_META = {
  versi: '2026.11.1',
  tanggalPembaruan: '2026-11-26',
  perkiraanUkuranKB: 627,
  cakupan: 'APBN Pusat TA 2025–2026, contoh Pendidikan & PIP, Jejak Anggaran, Kamus, Kuis & Latihan, Aspirasi Data',
};

export const CACHE_PREFIX = 'transkeu-paket-v';
export const KUNCI_LOKAL_USER = ['transkeu.kuis', 'transkeu.aspirasi_draf', 'transkeu.umpan', 'transkeu.riwayat', 'transkeu.latihan'];
export const KUNCI_PAKET = 'transkeu.paket_offline';

export const ASET_PAKET_WAJIB = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/logo.jpg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/src/styles.css',
  '/src/app.js',
  '/src/mesin.js',
  '/src/hitung.js',
  '/src/ikon.js',
  '/src/visual.js',
  '/src/evidence.js',
  '/src/instansi.js',
  '/src/articles-ui.js',
  '/src/impacts-ui.js',
  '/src/claim-check-ui.js',
  '/src/offline.js',
  '/src/kuis-logic.js',
  '/data/fakta.js',
  '/data/topik.js',
  '/data/istilah.js',
  '/data/kuis.js',
  '/data/jejak.js',
  '/data/aspirasi.js',
  '/data/instansi.js',
  '/data/artikel.js',
  '/data/bukti-lapangan.js',
];

export const namaCacheAktif = (versi = PAKET_META.versi) => `${CACHE_PREFIX}${versi}`;
export const namaCacheStaging = (versi = PAKET_META.versi, stamp = Date.now()) => `${CACHE_PREFIX}staging-${versi}-${stamp}`;

export function formatUkuranByte(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return `~${PAKET_META.perkiraanUkuranKB} KB`;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
}

export function bacaStatusPaket(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KUNCI_PAKET);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.siap ? parsed : null;
  } catch {
    return null;
  }
}

export function tulisStatusPaket(info, storage = globalThis.localStorage) {
  try {
    if (info) storage?.setItem(KUNCI_PAKET, JSON.stringify(info));
    else storage?.removeItem(KUNCI_PAKET);
  } catch { /* abaikan di mode privat */ }
}

export async function verifikasiCacheUtuh({ cachesApi = globalThis.caches, storage = globalThis.localStorage } = {}) {
  const meta = bacaStatusPaket(storage);
  if (!meta) return { siap: false, meta: null };
  if (!cachesApi) return { siap: Boolean(meta.siap), meta };
  const keys = await cachesApi.keys();
  const target = meta.cacheName || namaCacheAktif(meta.versi);
  if (!keys.includes(target)) {
    return { siap: false, meta: null };
  }
  return { siap: true, meta };
}

/**
 * Mengunduh seluruh aset wajib ke cache staging lebih dulu.
 * Jika gagal atau terputus di tengah jalan, staging dihapus dan paket lama yang masih utuh tetap aktif.
 */
export async function unduhPaketOffline({
  versi = PAKET_META.versi,
  tanggalPembaruan = PAKET_META.tanggalPembaruan,
  aset = ASET_PAKET_WAJIB,
  cachesApi = globalThis.caches,
  fetchImpl = globalThis.fetch,
  storage = globalThis.localStorage,
  onProgress = () => {},
  signal,
} = {}) {
  if (!cachesApi || typeof fetchImpl !== 'function') {
    throw new Error('Browser ini belum mendukung Cache Storage untuk mode offline.');
  }

  const prevMeta = bacaStatusPaket(storage);
  const stagingName = namaCacheStaging(versi);
  const activeName = namaCacheAktif(versi);
  const staging = await cachesApi.open(stagingName);
  let totalBytes = 0;

  try {
    const total = aset.length;
    const responses = [];

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) throw new Error('Unduhan paket dibatalkan atau terputus.');
      const url = aset[i];
      const res = await fetchImpl(url, { cache: 'reload', signal });
      if (!res || !res.ok) {
        throw new Error(`Gagal mengunduh berkas wajib (${url}: ${res?.status ?? 'jaringan terputus'}).`);
      }
      const clone = res.clone();
      const buf = await clone.arrayBuffer();
      totalBytes += buf.byteLength;
      await staging.put(url, res);
      responses.push({ url, size: buf.byteLength });
      onProgress({
        selesai: i + 1,
        total,
        persen: Math.round(((i + 1) / total) * 100),
        berkas: url,
        ukuranBytes: totalBytes,
      });
    }

    // Commit ke cache versi target setelah 100% berkas terverifikasi lengkap.
    const active = await cachesApi.open(activeName);
    for (const { url } of responses) {
      const item = await staging.match(url);
      if (!item) throw new Error(`Berkas staging hilang sebelum commit: ${url}`);
      await active.put(url, item);
    }

    const nextMeta = {
      siap: true,
      versi,
      tanggalPembaruan,
      ukuranBytes: totalBytes,
      jumlahBerkas: responses.length,
      cacheName: activeName,
      diunduhPada: new Date().toISOString(),
    };
    tulisStatusPaket(nextMeta, storage);

    // Bersihkan cache lama dan staging setelah paket baru selesai disimpan utuh.
    const allKeys = await cachesApi.keys();
    for (const k of allKeys) {
      if (k.startsWith(CACHE_PREFIX) && k !== activeName) {
        await cachesApi.delete(k);
      }
    }
    return nextMeta;
  } catch (err) {
    // Rollback: hapus staging saja, JANGAN sentuh paket lama atau data kuis/draf pengguna.
    await cachesApi.delete(stagingName).catch(() => {});
    if (prevMeta) tulisStatusPaket(prevMeta, storage);
    throw err;
  }
}

export async function hapusPaketOffline({ cachesApi = globalThis.caches, storage = globalThis.localStorage } = {}) {
  if (cachesApi) {
    const keys = await cachesApi.keys();
    for (const k of keys) {
      if (k.startsWith(CACHE_PREFIX)) await cachesApi.delete(k);
    }
  }
  tulisStatusPaket(null, storage);
}

export async function hapusSemuaDataLokal({ cachesApi = globalThis.caches, storage = globalThis.localStorage } = {}) {
  await hapusPaketOffline({ cachesApi, storage });
  try {
    for (const k of KUNCI_LOKAL_USER) storage?.removeItem(k);
  } catch { /* abaikan */ }
}
