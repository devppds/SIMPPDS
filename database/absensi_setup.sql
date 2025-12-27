-- ============================================
-- MODULE KEAMANAN: ABSENSI FORMAL
-- ============================================

CREATE TABLE IF NOT EXISTS keamanan_absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT, -- Denormalisasi untuk kemudahan query history simple
    kelas TEXT,       -- Snapshot kelas saat absen
    tanggal DATE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('H', 'S', 'I', 'A', 'T')), -- Hadir, Sakit, Izin, Alpha, Terlambat
    keterangan TEXT,
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index agar performa cepat saat load per tanggal/kelas
CREATE INDEX IF NOT EXISTS idx_absensi_tgl_kls ON keamanan_absensi(tanggal, kelas);
CREATE INDEX IF NOT EXISTS idx_absensi_santri ON keamanan_absensi(santri_id);

-- Constraint agar satu santri tidak diabsen 2x di tanggal yang sama (opsional, tapi bagus untuk integritas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_absensi ON keamanan_absensi(santri_id, tanggal);
