DROP TABLE IF EXISTS kamar;
CREATE TABLE IF NOT EXISTS kamar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kamar TEXT,
    asrama TEXT,
    kapasitas TEXT,
    penasihat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
