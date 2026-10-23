// Handler terpadu untuk POST /api/tanya (kompatibel dengan Vercel Serverless & Node local serve)
import { fakta, kegunaan } from '../data/fakta.js';
import { topik } from '../data/topik.js';
import { istilah } from '../data/istilah.js';
import { adaKunci, buatPenjawab } from './ai.js';
import { jawab } from './mesin.js';

const data = { fakta, kegunaan, topik, istilah };
const tanyaAI = adaKunci() ? buatPenjawab(data) : null;

// Batas harian per IP (in-memory)
const BATAS_HARIAN = Number(process.env.BATAS_TANYA_HARIAN) || 50;
const kuota = new Map();

function bolehTanya(ip) {
  const hari = new Date().toISOString().slice(0, 10);
  const k = kuota.get(ip);
  const n = k?.hari === hari ? k.n + 1 : 1;
  kuota.set(ip, { hari, n });
  return n <= BATAS_HARIAN;
}

export async function tanganiTanya({ badan = {}, ip = '127.0.0.1' } = {}) {
  const pertanyaan = String(badan.pertanyaan ?? '').trim().slice(0, 300);
  if (!pertanyaan) {
    return { kode: 400, isi: { error: 'pertanyaan_kosong' } };
  }

  if (!bolehTanya(ip)) {
    // Kuota habis: fallback ke mesin aturan dengan notifikasi
    const hasilDasar = jawab(pertanyaan, data);
    return {
      kode: 429,
      isi: {
        ...hasilDasar,
        ai: false,
        mode_dasar: true,
        peringatan: 'Batas harian AI per IP tercapai. Jawaban dialihkan ke Mode Dasar.',
      },
    };
  }

  const riwayat = (Array.isArray(badan.riwayat) ? badan.riwayat : [])
    .slice(-3)
    .map((g) => ({ tanya: String(g.tanya ?? '').slice(0, 300), jawab: String(g.jawab ?? '').slice(0, 1500) }))
    .filter((g) => g.tanya && g.jawab);

  // Jika AI aktif dan punya API key
  if (tanyaAI) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const hasilAI = await Promise.race([
        tanyaAI(pertanyaan, riwayat),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('AI timeout 30 detik')));
        }),
      ]);
      clearTimeout(timeoutId);

      return {
        kode: 200,
        isi: { ...hasilAI, ai: true, mode_dasar: false },
      };
    } catch (err) {
      console.error('[API/tanya] AI gagal, beralih ke Mode Dasar:', err.name, err.message);
      // Fallback transparan ke mode dasar tanpa berpura-pura sebagai AI
      const hasilDasar = jawab(pertanyaan, data);
      return {
        kode: 200,
        isi: {
          ...hasilDasar,
          ai: false,
          mode_dasar: true,
          catatan_mode: 'Layanan AI sedang mengalami kendala. Jawaban disusun menggunakan Mode Dasar (aturan sistem).',
        },
      };
    }
  }

  // Jika AI tidak aktif (tidak ada GEMINI_API_KEY)
  const hasilDasar = jawab(pertanyaan, data);
  return {
    kode: 200,
    isi: {
      ...hasilDasar,
      ai: false,
      mode_dasar: true,
      catatan_mode: 'AI sedang tidak aktif karena kunci API belum dikonfigurasi di server. Menggunakan Mode Dasar.',
    },
  };
}
