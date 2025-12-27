-- ============================================
-- MASTER DATA JABATAN PENGURUS
-- ============================================

CREATE TABLE IF NOT EXISTS master_jabatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kelompok TEXT NOT NULL, -- 'Dewan Harian' atau 'Pleno'
    nama_jabatan TEXT NOT NULL,
    urutan INTEGER DEFAULT 0
);

-- Hapus data lama jika ada (untuk reset seed)
DELETE FROM master_jabatan;

-- DEWAN HARIAN
INSERT INTO master_jabatan (kelompok, nama_jabatan, urutan) VALUES 
('Dewan Harian', 'Ketua Umum', 1),
('Dewan Harian', 'Ketua I', 2),
('Dewan Harian', 'Ketua II', 3),
('Dewan Harian', 'Ketua III', 4),
('Dewan Harian', 'Sekretaris Umum', 5),
('Dewan Harian', 'Sekretaris I', 6),
('Dewan Harian', 'Sekretaris II', 7),
('Dewan Harian', 'Sekretaris III', 8),
('Dewan Harian', 'Bendahara Umum', 9),
('Dewan Harian', 'Bendahara I', 10),
('Dewan Harian', 'Bendahara II', 11);

-- PLENO (Unit Kerja)
INSERT INTO master_jabatan (kelompok, nama_jabatan, urutan) VALUES 
('Pleno', 'Pendidikan', 12),
('Pleno', 'Wajar & Murottil', 13),
('Pleno', 'Keamanan', 14),
('Pleno', 'Jam''iyyah', 15),
('Pleno', 'Keuangan', 16),
('Pleno', 'PLP', 17),
('Pleno', 'Humasy & Logistik', 18),
('Pleno', 'Kebersihan (KBR)', 19),
('Pleno', 'Blok', 20),
('Pleno', 'Pembangunan', 21),
('Pleno', 'Dok-Media Pondok', 22),
('Pleno', 'Takmir Masjid B', 23),
('Pleno', 'Takmir Masjid C', 24),
('Pleno', 'Kesehatan', 25),
('Pleno', 'BUMP', 26);
