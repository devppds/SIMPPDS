-- ============================================
-- MODULE KEUANGAN SANTRI (FRONT OFFICE)
-- ============================================

-- 1. Tabel Tarif Pembayaran (Pengaturan)
CREATE TABLE IF NOT EXISTS keuangan_tarif (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_status TEXT NOT NULL, -- Biasa Baru, Biasa Lama, Ndalem, dll
    kelas TEXT DEFAULT 'Semua', -- 1, 2, 3, atau Semua
    nominal INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Transaksi Pembayaran Santri
CREATE TABLE IF NOT EXISTS keuangan_pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT, -- Denormalized for easier query
    tanggal DATE NOT NULL,
    jenis_pembayaran TEXT NOT NULL CHECK(jenis_pembayaran IN ('Syahriah', 'Tabungan')),
    bulan_tagihan TEXT, -- Format YYYY-MM (Hanya untuk Syahriah)
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Arus Kas Keuangan (Harian)
CREATE TABLE IF NOT EXISTS keuangan_arus_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('Masuk', 'Keluar')),
    kategori TEXT NOT NULL CHECK(kategori IN ('Pembayaran Santri', 'Setor Bendahara Pondok', 'Setor Madrasah', 'Belanja Operasional', 'Lainnya')),
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    pembayaran_id INTEGER, -- Link ke keuangan_pembayaran jika sumbernya dari situ
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tarif_status ON keuangan_tarif(kategori_status);
CREATE INDEX IF NOT EXISTS idx_pembayaran_santri ON keuangan_pembayaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal ON keuangan_pembayaran(tanggal);
CREATE INDEX IF NOT EXISTS idx_arus_kas_tanggal ON keuangan_arus_kas(tanggal);

-- Sample Data Tarif
INSERT INTO keuangan_tarif (kategori_status, nominal, keterangan) VALUES 
('Biasa Baru', 500000, 'Tarif standar santri baru'),
('Biasa Lama', 450000, 'Tarif standar santri lama'),
('Ndalem 50% Baru', 250000, 'Diskon keluarga ndalem baru'),
('Ndalem 100% Baru', 0, 'Gratis keluarga ndalem baru'),
('PKJ', 300000, 'Program Khusus'),
('Nduduk', 200000, 'Santri non-asrama');
