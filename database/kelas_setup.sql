-- ============================================
-- MASTER DATA KELAS (MIU / MHM / MA'HAD ALY)
-- ============================================

CREATE TABLE IF NOT EXISTS master_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembaga TEXT NOT NULL, -- MIU, MHM, MA'HAD ALY
    nama_kelas TEXT NOT NULL,
    urutan INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index agar pencarian cepat
CREATE INDEX IF NOT EXISTS idx_kelas_lembaga ON master_kelas(lembaga);
CREATE INDEX IF NOT EXISTS idx_kelas_urutan ON master_kelas(urutan);

-- Insert Data (Reset dulu biar gak duplikat kalau dijalankan ulang)
DELETE FROM master_kelas;

-- Data MIU
INSERT INTO master_kelas (lembaga, nama_kelas, urutan) VALUES 
('MIU', 'I Ula', 1),
('MIU', 'II Ula', 2),
('MIU', 'III Ula', 3),
('MIU', 'I Wustho', 4),
('MIU', 'II Wustho', 5),
('MIU', 'III Wustho', 6),
('MIU', 'I Ulya', 7),
('MIU', 'II Ulya', 8),
('MIU', 'III Ulya', 9);

-- Data MHM (Mulai dari IV Ibtida'iyyah)
INSERT INTO master_kelas (lembaga, nama_kelas, urutan) VALUES 
('MHM', 'IV Ibtida''iyyah', 10),
('MHM', 'V Ibtida''iyyah', 11),
('MHM', 'VI Ibtida''iyyah', 12),
('MHM', 'I Tsanawiyyah', 13),
('MHM', 'II Tsanawiyyah', 14),
('MHM', 'III Tsanawiyyah', 15),
('MHM', 'I Aliyyah', 16),
('MHM', 'II Aliyyah', 17),
('MHM', 'III Aliyyah', 18);

-- Data Ma'had Aly / Tambahan MHM
INSERT INTO master_kelas (lembaga, nama_kelas, urutan) VALUES 
('MHM', 'Ma''had Aly I-II', 19),
('MHM', 'Ma''had Aly III-IV', 20),
('MHM', 'Ma''had Aly V-VI', 21),
('MHM', 'II Ma''had Aly', 22);

-- Note: 'II Ma''had Aly' ditaruh paling akhir sesuai request user.
