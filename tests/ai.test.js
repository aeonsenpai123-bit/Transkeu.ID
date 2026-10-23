// Menguji jalur AI Google Gemini dengan klien palsu: tidak ada panggilan API sungguhan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buatPenjawab, buatPromptSistem, buatSkema } from '../src/ai.js';
import { JawabanDitolak } from '../src/penjaga.js';
import { fakta, kegunaan } from '../data/fakta.js';
import { istilah } from '../data/istilah.js';

const data = { fakta, kegunaan, istilah };
const klienPalsu = (keluaran, finishReason = 'STOP') => {
  const panggilan = [];
  return {
    panggilan,
    models: {
      generateContent: async (req) => {
        panggilan.push(req);
        if (finishReason === 'refusal' || finishReason === 'SAFETY') {
          return {
            text: '',
            candidates: [{ finishReason }],
          };
        }
        return {
          text: JSON.stringify(keluaran),
          candidates: [{ finishReason }],
        };
      },
    },
  };
};

test('prompt sistem memuat semua id fakta dan tidak berubah antarpertanyaan', () => {
  const p = buatPromptSistem(data);
  for (const f of fakta) assert.ok(p.includes(f.id));
  assert.equal(p, buatPromptSistem(data));
  assert.deepEqual(buatSkema(data).properties.fakta_ids.items.enum, fakta.map((f) => f.id));
});

test('jawaban AI Gemini diisi angka dari tabel fakta dan persen dihitung kode', async () => {
  const klien = klienPalsu({
    status: 'jawab',
    jawaban: 'Untuk pendidikan, APBN 2026 menyiapkan {{pendidikan-2026-anggaran}}. Sampai {{pendidikan-2026-realisasi-sep|posisi}} sudah terpakai {{pendidikan-2026-realisasi-sep}}, sekitar {{persen}}.',
    fakta_ids: ['pendidikan-2026-anggaran', 'pendidikan-2026-realisasi-sep'],
    kegunaan_ids: ['guna-1'],
    istilah: ['Realisasi'],
    batasan: '',
    lanjutan: ['Untuk apa saja dana pendidikan?'],
  });
  const h = await buatPenjawab(data, klien)('uang sekolah dipakai buat apa aja?', [{ tanya: 'halo', jawab: 'hai' }]);
  assert.equal(h.ringkas, 'Untuk pendidikan, APBN 2026 menyiapkan Rp769,1 triliun. Sampai s.d. 30 September 2026 sudah terpakai Rp574,2 triliun, sekitar 74,7 persen.');
  assert.equal(h.hitung.teksHasil, '74,7 persen');

  const req = klien.panggilan[0];
  assert.equal(req.model, process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  assert.equal(req.config.responseMimeType, 'application/json');
  assert.ok(req.config.systemInstruction.includes('Kamu adalah pemandu literasi fiskal Transkeu.ID.'));
  assert.equal(req.contents.length, 3);
  assert.equal(req.contents[0].role, 'user');
  assert.equal(req.contents[1].role, 'model');
  assert.equal(req.contents[2].role, 'user');
});

test('jawaban AI dengan angka karangan ditolak', async () => {
  const klien = klienPalsu({ status: 'jawab', jawaban: 'Kira-kira Rp700 triliun.', fakta_ids: [], kegunaan_ids: [], istilah: [], batasan: '', lanjutan: [] });
  await assert.rejects(buatPenjawab(data, klien)('anggaran pendidikan?'), JawabanDitolak);
});

test('penolakan model berakhir dengan pesan baku', async () => {
  const h = await buatPenjawab(data, klienPalsu({}, 'refusal'))('...');
  assert.equal(h.status, 'tidak_tersedia');
});
