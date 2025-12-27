-- ============================================
-- CLOUDFLARE D1 DATABASE SETUP
-- Arsiparis Module Tables
-- ============================================

-- 1. Tabel Arsip Surat Masuk/Keluar
CREATE TABLE IF NOT EXISTS arsip_surat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT NOT NULL,
    nomor_surat TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('Masuk', 'Keluar')),
    pengirim_penerima TEXT NOT NULL,
    perihal TEXT NOT NULL,
    keterangan TEXT,
    file_surat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Arsip Proposal
CREATE TABLE IF NOT EXISTS arsip_proposal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT NOT NULL,
    nomor_proposal TEXT NOT NULL,
    judul TEXT NOT NULL,
    pengaju TEXT NOT NULL,
    nominal TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Diajukan', 'Disetujui', 'Ditolak')),
    file_proposal TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Arsip Akta Tanah
CREATE TABLE IF NOT EXISTS arsip_akta_tanah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_akta TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    luas_tanah TEXT NOT NULL,
    atas_nama TEXT NOT NULL,
    status_kepemilikan TEXT NOT NULL CHECK(status_kepemilikan IN ('Milik Pondok', 'Wakaf', 'Sewa')),
    file_akta TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Arsip Pengurus Per-Periode
CREATE TABLE IF NOT EXISTS arsip_pengurus_periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periode_mulai TEXT NOT NULL,
    periode_selesai TEXT NOT NULL,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    divisi TEXT,
    foto_pengurus TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Arsip Pengajar Per-Periode
CREATE TABLE IF NOT EXISTS arsip_pengajar_periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periode_mulai TEXT NOT NULL,
    periode_selesai TEXT NOT NULL,
    nama TEXT NOT NULL,
    kelas_ampu TEXT NOT NULL,
    foto_pengajar TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================

-- Indexes untuk arsip_surat
CREATE INDEX IF NOT EXISTS idx_surat_tanggal ON arsip_surat(tanggal);
CREATE INDEX IF NOT EXISTS idx_surat_tipe ON arsip_surat(tipe);
CREATE INDEX IF NOT EXISTS idx_surat_nomor ON arsip_surat(nomor_surat);

-- Indexes untuk arsip_proposal
CREATE INDEX IF NOT EXISTS idx_proposal_tanggal ON arsip_proposal(tanggal);
CREATE INDEX IF NOT EXISTS idx_proposal_status ON arsip_proposal(status);
CREATE INDEX IF NOT EXISTS idx_proposal_nomor ON arsip_proposal(nomor_proposal);

-- Indexes untuk arsip_akta_tanah
CREATE INDEX IF NOT EXISTS idx_akta_nomor ON arsip_akta_tanah(nomor_akta);
CREATE INDEX IF NOT EXISTS idx_akta_lokasi ON arsip_akta_tanah(lokasi);

-- Indexes untuk arsip_pengurus_periode
CREATE INDEX IF NOT EXISTS idx_pengurus_periode ON arsip_pengurus_periode(periode_mulai, periode_selesai);
CREATE INDEX IF NOT EXISTS idx_pengurus_nama ON arsip_pengurus_periode(nama);

-- Indexes untuk arsip_pengajar_periode
CREATE INDEX IF NOT EXISTS idx_pengajar_periode ON arsip_pengajar_periode(periode_mulai, periode_selesai);
CREATE INDEX IF NOT EXISTS idx_pengajar_nama ON arsip_pengajar_periode(nama);

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================

-- Sample data untuk arsip_surat
INSERT INTO arsip_surat (tanggal, nomor_surat, tipe, pengirim_penerima, perihal, keterangan) VALUES
('2024-01-15', '001/SM/I/2024', 'Masuk', 'Kemenag Kab. Bogor', 'Undangan Rapat Koordinasi', 'Rapat koordinasi pengurus pondok pesantren'),
('2024-01-20', '002/SK/I/2024', 'Keluar', 'Dinas Pendidikan', 'Permohonan Izin Operasional', 'Perpanjangan izin operasional tahun 2024');

-- Sample data untuk arsip_proposal
INSERT INTO arsip_proposal (tanggal, nomor_proposal, judul, pengaju, nominal, status, keterangan) VALUES
('2024-02-01', 'PROP/001/2024', 'Pembangunan Asrama Baru', 'Panitia Pembangunan', '500000000', 'Disetujui', 'Proposal disetujui untuk tahap 1'),
('2024-02-15', 'PROP/002/2024', 'Pengadaan Komputer Lab', 'Divisi Pendidikan', '75000000', 'Diajukan', 'Menunggu persetujuan');

-- Sample data untuk arsip_akta_tanah
INSERT INTO arsip_akta_tanah (nomor_akta, tanggal, lokasi, luas_tanah, atas_nama, status_kepemilikan, keterangan) VALUES
('123/AJB/2020', '2020-05-10', 'Jl. Raya Pondok No. 123', '5000', 'Yayasan Al-Hikmah', 'Milik Pondok', 'Tanah utama pondok pesantren'),
('456/WAKAF/2018', '2018-03-15', 'Jl. Pesantren Baru', '3000', 'Wakaf H. Ahmad', 'Wakaf', 'Tanah wakaf untuk perluasan');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Cek jumlah data di setiap tabel
SELECT 'arsip_surat' as tabel, COUNT(*) as jumlah FROM arsip_surat
UNION ALL
SELECT 'arsip_proposal', COUNT(*) FROM arsip_proposal
UNION ALL
SELECT 'arsip_akta_tanah', COUNT(*) FROM arsip_akta_tanah
UNION ALL
SELECT 'arsip_pengurus_periode', COUNT(*) FROM arsip_pengurus_periode
UNION ALL
SELECT 'arsip_pengajar_periode', COUNT(*) FROM arsip_pengajar_periode;
