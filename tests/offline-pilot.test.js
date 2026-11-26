import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { fakta, kegunaan } from '../data/fakta.js';
import { topik } from '../data/topik.js';
import { istilah, cariKamus } from '../data/istilah.js';
import { jejakAnggaran } from '../data/jejak.js';
import { kuisSetA, kuisSetB, latihanBertingkat } from '../data/kuis.js';
import { susunDrafAspirasi } from '../data/aspirasi.js';
import { jawab } from '../src/mesin.js';
import { traceEvidence } from '../src/evidence.js';
import {
  unduhPaketOffline,
  verifikasiCacheUtuh,
  hapusPaketOffline,
  hapusSemuaDataLokal,
  KUNCI_PAKET,
} from '../src/offline.js';
import {
  migrasiSkorKuis,
  nilaiSetKuis,
  ringkasPerubahanPilot,
  eksporHasilPilot,
} from '../src/kuis-logic.js';
import { handleQuestion } from '../server/handler.js';

const data = { fakta, kegunaan, topik, istilah, jejak: jejakAnggaran };

function mockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map.entries()),
  };
}

function mockCaches() {
  const stores = new Map();
  return {
    stores,
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return {
        put: async (url, res) => m.set(url, res),
        match: async (url) => m.get(url) ?? null,
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
  };
}

test('PIP pagu gabungan beasiswa dan realisasi PIP tidak menghasilkan rasio di Tanya AI maupun Jejak Anggaran', () => {
  const res = jawab('Bagaimana anggaran dan penyaluran PIP 2026?', data);
  assert.equal(res.status, 'ok');
  assert.equal(res.hitung, null);
  assert.ok(res.angka.some((a) => a.id === 'pip-2026-realisasi-sep'));
  assert.ok(res.angka.some((a) => a.id === 'beasiswa-2026-anggaran'));
  assert.ok(res.ringkas.includes('Rp11,2 triliun'));
  assert.ok(res.ringkas.includes('Rp63,8 triliun'));
  const trace = traceEvidence(jejakAnggaran.find((j) => j.id === 'jejak-pip'));
  assert.equal(trace.comparable, false);
  assert.equal(trace.ratio, null);
  assert.ok(trace.warnings[0].includes('gabungan beasiswa'));
});

test('pertanyaan ambigu anggaran pendidikan membedakan cakupan, dan tindak lanjut tahun sebelumnya mencari 2025', () => {
  const ambig = jawab('Berapa anggaran pendidikan?', data);
  assert.equal(ambig.status, 'ok');
  assert.ok(ambig.angka.some((a) => a.id === 'pendidikan-2026-anggaran'));
  assert.ok(ambig.angka.some((a) => a.id === 'fungsi-pendidikan-2026-anggaran'));
  assert.ok(ambig.paragraf.some((p) => p.teks.includes('belanja pemerintah pusat fungsi pendidikan')));

  const lanjut = jawab('Kalau tahun sebelumnya?', data, [{ tanya: 'Berapa anggaran pendidikan 2026?' }]);
  assert.equal(lanjut.status, 'tidak_tersedia');
  assert.match(lanjut.alasan, /2025/);
});

test('pertanyaan Jakarta Timur tidak mengarang data lokal atau memaksakan APBN nasional sebagai data sekolah', () => {
  const jaktim = jawab('Berapa dana PIP untuk sekolah di Jakarta Timur?', data);
  assert.equal(jaktim.status, 'tidak_tersedia');
  assert.match(jaktim.alasan, /Jakarta Timur/);
});

test('pembaruan paket offline yang terputus menjaga paket lama, skor kuis, dan draf tetap utuh', async () => {
  const cachesApi = mockCaches();
  const storage = mockStorage({
    'transkeu.kuis': JSON.stringify({ sebelum: { skor: 4, total: 5, persen: 80 } }),
    'transkeu.aspirasi_draf': JSON.stringify({ masalah: 'Draf tersimpan lokal' }),
  });

  const okFetch = async (url) => new Response(`isi-${url}`, { status: 200 });
  const v1 = await unduhPaketOffline({
    versi: '2026.10.1',
    aset: ['/index.html', '/src/app.js'],
    cachesApi,
    fetchImpl: okFetch,
    storage,
  });
  assert.equal(v1.siap, true);
  assert.equal((await verifikasiCacheUtuh({ cachesApi, storage })).siap, true);

  // Simulasikan unduhan v2 terputus di berkas kedua
  let panggilan = 0;
  const brokenFetch = async (url) => {
    panggilan += 1;
    if (panggilan === 2) throw new Error('Network dropped');
    return new Response(`baru-${url}`, { status: 200 });
  };
  await assert.rejects(
    unduhPaketOffline({
      versi: '2026.11.9',
      aset: ['/index.html', '/src/app.js'],
      cachesApi,
      fetchImpl: brokenFetch,
      storage,
    }),
    /Network dropped/
  );

  // Paket lama, skor kuis, dan draf harus tetap utuh; staging cache dibersihkan.
  const keys = await cachesApi.keys();
  assert.deepEqual(keys, ['transkeu-paket-v2026.10.1']);
  assert.equal(JSON.parse(storage.getItem(KUNCI_PAKET)).versi, '2026.10.1');
  assert.equal(JSON.parse(storage.getItem('transkeu.kuis')).sebelum.skor, 4);
  assert.equal(JSON.parse(storage.getItem('transkeu.aspirasi_draf')).masalah, 'Draf tersimpan lokal');

  // Hapus cache paket saja tidak menghapus skor dan draf; hapusSemuaDataLokal menghapus semua.
  await hapusPaketOffline({ cachesApi, storage });
  assert.equal((await verifikasiCacheUtuh({ cachesApi, storage })).siap, false);
  assert.equal(JSON.parse(storage.getItem('transkeu.kuis')).sebelum.skor, 4);

  await hapusSemuaDataLokal({ cachesApi, storage });
  assert.equal(storage.getItem('transkeu.kuis'), null);
  assert.equal(storage.getItem('transkeu.aspirasi_draf'), null);
});

test('kamus toleran salah ketik sederhana dan memuat istilah prioritas serta contoh membaca angka', () => {
  for (const wajib of ['Pagu', 'Realisasi', 'Outlook', 'Tanggal Posisi', 'Belanja Pemerintah Pusat', 'TKD', 'Subsidi', 'Kompensasi', 'Output', 'Dampak']) {
    const found = istilah.find((i) => i.istilah === wajib);
    assert.ok(found, `Istilah prioritas wajib ada: ${wajib}`);
    assert.ok(found.contoh, `Contoh membaca wajib ada pada: ${wajib}`);
  }
  assert.equal(cariKamus(istilah, 'realisai')[0].istilah, 'Realisasi');
  assert.equal(cariKamus(istilah, 'paggu')[0].istilah, 'Pagu');
  assert.equal(cariKamus(istilah, 'cutoff')[0].istilah, 'Tanggal Posisi');
});

test('kuis paralel, pembahasan pre-test tertunda sampai post-test, migrasi skor lama, dan ekspor berpasangan tanpa nama', () => {
  assert.equal(kuisSetA.length, kuisSetB.length);
  assert.deepEqual(
    kuisSetA.map((s) => s.kompetensi),
    kuisSetB.map((s) => s.kompetensi)
  );
  assert.ok(latihanBertingkat.some((l) => l.id === 'latihan-pip-cakupan'));

  const lama = migrasiSkorKuis({ sebelum: { skor: 3, waktu: '2026-10-25T00:00:00Z' } });
  assert.equal(lama.sebelum.persen, 60);
  assert.equal(ringkasPerubahanPilot(lama).pembahasanPreTerbuka, false);

  const pre = nilaiSetKuis(kuisSetA, kuisSetA.map((s, i) => (i === 0 ? (s.benar + 1) % 4 : s.benar)));
  const post = nilaiSetKuis(kuisSetB, kuisSetB.map((s) => s.benar));
  const gabung = { versi: '2026.11-unj-v2', pesertaKode: 'UNJ-TEST', sebelum: pre, sesudah: post };
  const ringkas = ringkasPerubahanPilot(gabung);
  assert.equal(ringkas.pembahasanPreTerbuka, true);
  assert.equal(ringkas.perubahanPoinPersentase, 20);

  const ekspor = eksporHasilPilot(gabung, { 'latihan-pip-cakupan': { benar: true } });
  assert.equal(ekspor.peserta_kode, 'UNJ-TEST');
  assert.equal(ekspor.perubahan_poin_persentase, 20);
  assert.ok(ekspor.catatan_keterbatasan.includes('tanpa nama'));
});

test('draf aspirasi memiliki urutan masalah, bukti, batas bukti, dan usulan tanpa pengiriman otomatis', () => {
  const draf = susunDrafAspirasi({
    topik: 'Pendidikan',
    lokasi: 'Jakarta Timur',
    masalah: 'Siswa membutuhkan kejelasan syarat penyaluran PIP.',
    dataPendukung: 'APBN KiTa Okt 2026 hlm. 29: Penyaluran PIP Rp11,2 T untuk 16 juta siswa.',
    masukan: 'Mohon sosialisasi jadwal penyaluran di sekolah.',
  });
  const idxMasalah = draf.indexOf('1. Masalah yang Dialami:');
  const idxBukti = draf.indexOf('2. Bukti Data APBN & Sumber Resmi:');
  const idxBatas = draf.indexOf('3. Batas Bukti:');
  const idxUsulan = draf.indexOf('4. Usulan Perbaikan:');
  assert.ok(idxMasalah > 0 && idxBukti > idxMasalah && idxBatas > idxBukti && idxUsulan > idxBatas);
});

test('Mode Offline menjawab PIP tanpa memanggil fetch /api/tanya dan tautan PDF berlabel Perlu internet', async (t) => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const { document, window } = parseHTML(html);
  const store = mockStorage();
  let fetchCalled = false;

  const origNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
  t.after(() => { if (origNav) Object.defineProperty(globalThis, 'navigator', origNav); });

  Object.assign(globalThis, {
    document,
    window,
    ResizeObserver: class { observe() {} },
    localStorage: store,
    fetch: async () => {
      fetchCalled = true;
      throw new Error('Tidak boleh memanggil server saat offline');
    },
  });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLElement.prototype.close = function () { this.removeAttribute('open'); };
  window.scrollTo = () => {};

  await import(`../src/app.js?offlineTest=${Date.now()}`);
  document.getElementById('input-tanya').value = 'Bagaimana anggaran dan penyaluran PIP 2026?';
  document.getElementById('form-tanya').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => setImmediate(r));

  assert.equal(fetchCalled, false);
  const card = document.querySelector('#obrolan .jawaban');
  assert.ok(card);
  assert.ok(card.textContent.includes('Mode Offline'));
  assert.ok(card.textContent.includes('Rp11,2 triliun'));
  card.querySelector('.nilai').click();
  assert.ok(document.getElementById('sheet').hasAttribute('open'));
  assert.ok(document.getElementById('sheet-badan').textContent.includes('Perlu internet'));
});

test('model gagal pada mode online memicu Mode Dasar dengan rujukan yang tetap dapat diperiksa', async () => {
  const res = await handleQuestion(
    { pertanyaan: 'Berapa anggaran pendidikan 2026?' },
    {
      env: { LLM_PROVIDER: 'gemini', GEMINI_API_KEY: 'test-only' },
      fetchImpl: async () => { throw new Error('timeout'); },
      logger: { warn() {} },
    }
  );
  assert.equal(res.code, 200);
  assert.equal(res.body.ai, false);
  assert.equal(res.body.mode, 'dasar');
  assert.ok(res.body.sumber.length > 0);
});
