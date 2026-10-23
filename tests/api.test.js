import test from 'node:test';
import assert from 'node:assert/strict';
import { tanganiTanya } from '../src/api-handler.js';

test('tanganiTanya menolak pertanyaan kosong', async () => {
  const res = await tanganiTanya({ badan: { pertanyaan: '   ' } });
  assert.equal(res.kode, 400);
  assert.equal(res.isi.error, 'pertanyaan_kosong');
});

test('tanganiTanya mengembalikan mode dasar ketika AI tidak aktif atau fallback', async () => {
  const res = await tanganiTanya({ badan: { pertanyaan: 'Berapa anggaran pendidikan 2026?' } });
  assert.equal(res.kode, 200);
  assert.equal(res.isi.status, 'ok');
  assert.ok(res.isi.ringkas.includes('Rp769,1 triliun'));
  assert.equal(res.isi.mode_dasar, true);
  assert.equal(res.isi.ai, false);
  assert.ok(res.isi.visual, 'harus menyertakan visual data');
});
