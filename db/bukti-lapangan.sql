-- Bukti evaluasi disimpan terpisah dari angka APBN dan bacaan sekunder.
CREATE TABLE IF NOT EXISTS bukti_lapangan (
 id text PRIMARY KEY,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
 program_id text NOT NULL,
 tahun_anggaran integer NOT NULL,
 wilayah_kode text NOT NULL,
 payload jsonb NOT NULL,
 diperbarui_pada timestamptz NOT NULL DEFAULT now(),
 CHECK (payload->>'status' = status),
 CHECK (payload->>'program_id' = program_id),
 CHECK ((payload->>'tahun_anggaran')::integer = tahun_anggaran),
 CHECK (payload->>'wilayah_kode' = wilayah_kode)
);
CREATE INDEX IF NOT EXISTS bukti_program_wilayah_idx ON bukti_lapangan(program_id,tahun_anggaran,wilayah_kode);
-- Akun aplikasi hanya SELECT. Publikasi melalui kurasi; validateImpact harus lolos.
