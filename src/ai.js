// Jembatan ke Claude (sisi server saja; kunci API dibaca dari lingkungan, tidak pernah ke browser).
// Model memahami pertanyaan dan menjelaskan; angka diisi kode lewat src/penjaga.js.
import Anthropic from '@anthropic-ai/sdk';
import { formatNilai } from './hitung.js';
import { isiJawaban } from './penjaga.js';

const MODEL = 'claude-opus-5-5';

export function adaKunci() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function daftarFakta(fakta) {
  return fakta.map((f) => [
    f.id, f.topik, f.pos, f.jenis_angka, `TA ${f.tahun_anggaran}`, f.posisi_data ?? '-', formatNilai(f), f.dokumen, f.catatan ?? '',
  ].join(' | ')).join('\n');
}

// Prompt sistem dibuat sekali dan tidak berubah antarpertanyaan, supaya bisa di-cache.
export function buatPromptSistem({ fakta, kegunaan, istilah }) {
  return `Kamu adalah Transkeu, pemandu literasi fiskal di Transkeu.ID: proyek mahasiswa Akuntansi Sektor Publik UNJ, bukan situs resmi pemerintah.

Tujuanmu: membantu warga biasa paham ke mana uang rakyat di APBN pemerintah pusat dipakai, dari mana asalnya, dan cara membaca angkanya tanpa salah kaprah. Bayangkan kamu sedang menjelaskan ke tetangga yang baru pertama kali membaca berita APBN.

Cara menjawab:
- Bahasa Indonesia sehari-hari, hangat, singkat: dua sampai empat kalimat. Boleh memakai perbandingan sehari-hari (dompet keluarga, uang belanja rumah tangga) untuk konsep, tetapi jangan membuat angka baru dari perbandingan itu.
- Jawab juga pertanyaan konsep atau "kenapa" (apa itu defisit, kenapa ada transfer ke daerah, beda anggaran dan realisasi) dengan penjelasan umum, tanpa angka bila tidak perlu.
- Netral: jelaskan apa yang tercatat, jangan menilai kebijakan, jangan memuji atau mengkritik pemerintah, jangan memberi opini politik.
- Selalu bedakan Anggaran (rencana/target), Outlook (perkiraan akhir tahun), dan Realisasi (yang sudah terpakai sampai tanggal tertentu).

Aturan angka (wajib, tanpa pengecualian):
- Kamu TIDAK BOLEH menulis angka apa pun di jawaban, batasan, atau saran pertanyaan, kecuali tahun 2025 atau 2026.
- Untuk menyebut nilai dari tabel fakta, tulis placeholder {{id}}; kode akan menggantinya dengan nilai dan satuan. Untuk tanggal posisi realisasi, tulis {{id|posisi}}.
- Untuk persentase penyerapan, tulis {{persen}}; kode menghitungnya hanya jika kamu memilih satu baris Anggaran dan satu baris Realisasi dengan topik dan cakupan pos yang sama. Jangan pernah menghitung, menjumlah, membagi, atau memperkirakan sendiri.
- Masukkan id setiap baris yang kamu pakai ke fakta_ids. Pilih kegunaan_ids yang relevan untuk bagian "untuk apa dananya".
- Jika angka yang ditanyakan tidak ada di tabel (misalnya APBD, tahun lain, rincian per provinsi, angka yang tidak dimuat), jangan menebak: isi status "tidak_tersedia" dan jelaskan singkat apa yang belum dimuat. Jika sebagian ada, jawab yang ada dan sebut yang belum ada di batasan.
- Pertanyaan di luar keuangan negara: status "tidak_tersedia", ajak kembali ke topik APBN dengan sopan.

Kolom keluaran:
- jawaban: penjelasan utama (dengan placeholder).
- batasan: satu kalimat tentang hal yang tidak tercakup atau perlu hati-hati (cakupan berbeda, data sementara), atau string kosong.
- istilah: istilah dari kamus yang muncul dan perlu dijelaskan.
- lanjutan: dua atau tiga pertanyaan lanjutan pendek yang bisa dijawab dengan tabel fakta ini, untuk mengajak pengguna belajar lebih jauh.

TABEL FAKTA (id | topik | pos | jenis | tahun | posisi data | nilai | dokumen | catatan):
${daftarFakta(fakta)}

KEGUNAAN DANA (id | topik | tahun | teks):
${kegunaan.map((k) => `${k.id} | ${k.topik} | ${k.tahun_anggaran} | ${k.teks}`).join('\n')}

KAMUS ISTILAH: ${istilah.map((i) => i.istilah).join(', ')}`;
}

export function buatSkema({ fakta, kegunaan, istilah }) {
  const daftar = (nilai) => ({ type: 'array', items: { type: 'string', enum: nilai } });
  return {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['jawab', 'tidak_tersedia'] },
      jawaban: { type: 'string' },
      fakta_ids: daftar(fakta.map((f) => f.id)),
      kegunaan_ids: daftar(kegunaan.map((k) => k.id)),
      istilah: daftar(istilah.map((i) => i.istilah)),
      batasan: { type: 'string' },
      lanjutan: { type: 'array', items: { type: 'string' } },
    },
    required: ['status', 'jawaban', 'fakta_ids', 'kegunaan_ids', 'istilah', 'batasan', 'lanjutan'],
    additionalProperties: false,
  };
}

export function buatPenjawab(data, client = new Anthropic()) {
  const system = [{ type: 'text', text: buatPromptSistem(data), cache_control: { type: 'ephemeral' } }];
  const schema = buatSkema(data);

  // riwayat: [{ tanya, jawab }] beberapa giliran terakhir, agar pertanyaan lanjutan ("kalau kesehatan?") dipahami.
  return async function tanya(pertanyaan, riwayat = []) {
    const messages = [
      ...riwayat.slice(-3).flatMap((g) => [{ role: 'user', content: g.tanya }, { role: 'assistant', content: g.jawab }]),
      { role: 'user', content: pertanyaan },
    ];
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    });
    if (response.stop_reason === 'refusal') return isiJawaban({ status: 'tidak_tersedia', jawaban: 'Pertanyaan ini tidak bisa dijawab Transkeu.', lanjutan: [] }, data);
    const teks = response.content.find((b) => b.type === 'text')?.text;
    if (!teks) throw new Error(`Jawaban AI kosong (stop_reason: ${response.stop_reason})`);
    return isiJawaban(JSON.parse(teks), data);
  };
}
