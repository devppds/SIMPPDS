-- ============================================
-- MODULE KEUANGAN (SIMPLE VERSION)
-- ============================================

-- 1. Tarif Pembayaran
-- Mengatur harga syahriah berdasarkan status
CREATE TABLE IF NOT EXISTS keuangan_tarif (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_status TEXT NOT NULL, 
    kelas TEXT DEFAULT 'Semua',    
    nominal INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pembayaran Santri
-- Mencatat uang yang dibayar santri
CREATE TABLE IF NOT EXISTS keuangan_pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT, 
    tanggal DATE NOT NULL,
    jenis_pembayaran TEXT NOT NULL CHECK(jenis_pembayaran IN ('Syahriah', 'Tabungan')),
    bulan_tagihan TEXT, -- YYYY-MM
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Arus Kas
-- Mencatat keluar masuk uang secara umum (jurnal)
CREATE TABLE IF NOT EXISTS keuangan_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('Masuk', 'Keluar')),
    kategori TEXT NOT NULL, 
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    pembayaran_id INTEGER, -- Link ke id keuangan_pembayaran
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tarif_stt ON keuangan_tarif(kategori_status);
CREATE INDEX IF NOT EXISTS idx_bayar_snt ON keuangan_pembayaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_bayar_tgl ON keuangan_pembayaran(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_tgl ON keuangan_kas(tanggal);

-- Sample Data
INSERT INTO keuangan_tarif (kategori_status, nominal, keterangan) VALUES 
('Biasa Baru', 500000, 'Tarif standar santri baru'),
('Biasa Lama', 450000, 'Tarif standar santri lama'),
('Ndalem 50% Baru', 250000, 'Diskon Keluarga Ndalem'),
('Ndalem 100% Baru', 0, 'Free Keluarga Ndalem'),
('PKJ', 300000, 'Program Khusus'),
('Nduduk', 200000, 'Santri Non-Asrama');
