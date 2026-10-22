// Menguji jalur AI dengan klien palsu: tidak ada panggilan API sungguhan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buatPenjawab, buatPromptSistem, buatSkema } from '../src/ai.js';
import { JawabanDitolak } from '../src/penjaga.js';
import { fakta, kegunaan } from '../data/fakta.js';
import { istilah } from '../data/istilah.js';

const data = { fakta, kegunaan, istilah };
const klienPalsu = (keluaran, stop_reason = 'end_turn') => {
  const panggilan = [];
  return {
    panggilan,
    beta: { messages: { create: async (req) => { panggilan.push(req); return { stop_reason, content: [{ type: 'text', text: JSON.stringify(keluaran) }] }; } } },
  };
};

test('prompt sistem memuat semua id fakta dan tidak berubah antarpertanyaan (bisa di-cache)', () => {
  const p = buatPromptSistem(data);
  for (const f of fakta) assert.ok(p.includes(f.id));
  assert.equal(p, buatPromptSistem(data));
  assert.deepEqual(buatSkema(data).properties.fakta_ids.items.enum, fakta.map((f) => f.id));
});

test('jawaban AI diisi angka dari tabel fakta dan persen dihitung kode', async () => {
  const klien = klienPalsu({
    status: 'jawab',
    jawaban: 'Untuk pendidikan, APBN 2026 menyiapkan {{pendidikan-2026-anggaran}}. Sampai {{pendidikan-2026-realisasi-sep|posisi}} sudah terpakai {{pendidikan-2026-realisasi-sep}}, sekitar {{persen}}.',
    fakta_ids: ['pendidikan-2026-anggaran', 'pendidikan-2026-realisasi-sep'], kegunaan_ids: ['guna-1'], istilah: ['Realisasi'], batasan: '', lanjutan: ['Untuk apa saja dana pendidikan?'],
  });
  const h = await buatPenjawab(data, klien)('uang sekolah dipakai buat apa aja?', [{ tanya: 'halo', jawab: 'hai' }]);
  assert.equal(h.ringkas, 'Untuk pendidikan, APBN 2026 menyiapkan Rp769,1 triliun. Sampai s.d. 30 September 2026 sudah terpakai Rp574,2 triliun, sekitar 74,7 persen.');
  assert.equal(h.hitung.teksHasil, '74,7 persen');
  const req = klien.panggilan[0];
  assert.equal(req.model, 'claude-opus-5-5');
  assert.equal(req.output_config.format.type, 'json_schema');
  assert.equal(req.system[0].cache_control.type, 'ephemeral');
  assert.equal(req.messages.length, 3);
});

test('jawaban AI dengan angka karangan ditolak', async () => {
  const klien = klienPalsu({ status: 'jawab', jawaban: 'Kira-kira Rp700 triliun.', fakta_ids: [], kegunaan_ids: [], istilah: [], batasan: '', lanjutan: [] });
  await assert.rejects(buatPenjawab(data, klien)('anggaran pendidikan?'), JawabanDitolak);
});

test('penolakan model berakhir dengan pesan baku', async () => {
  const h = await buatPenjawab(data, klienPalsu({}, 'refusal'))('...');
  assert.equal(h.status, 'tidak_tersedia');
});
