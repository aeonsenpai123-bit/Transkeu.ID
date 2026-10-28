-- PostgreSQL. Terpisah dari fakta fiskal agar artikel tidak menjadi sumber angka grafik.
CREATE TABLE IF NOT EXISTS artikel_pendukung (
 id text PRIMARY KEY,
 judul text NOT NULL CHECK (length(judul) < 300),
 url text UNIQUE NOT NULL CHECK (url ~ '^https://melekapbn\.org/(articles|carousel)/'),
 penerbit text NOT NULL CHECK (penerbit = 'Melek APBN'),
 jenis text NOT NULL CHECK (jenis IN ('analisis','carousel')),
 penulis jsonb NOT NULL DEFAULT '[]',
 tanggal_terbit text CHECK (tanggal_terbit IS NULL OR tanggal_terbit ~ '^\d{4}-\d{2}-\d{2}$'),
 ringkasan text NOT NULL CHECK (length(ringkasan) <= 450),
 topik text[] NOT NULL,
 kata_kunci text[] NOT NULL,
 tahun_anggaran integer[] NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
 ditinjau_pada text NOT NULL CHECK (ditinjau_pada ~ '^\d{4}-\d{2}-\d{2}$'),
 cakupan_tinjauan text NOT NULL,
 diperbarui_pada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS artikel_topik_idx ON artikel_pendukung USING gin(topik);
-- Gunakan akun aplikasi read-only untuk SELECT; jangan berikan hak tulis tabel ini ke browser.
