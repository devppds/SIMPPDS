-- SIM-PPDS ACTIVE SCHEMA (v3)
-- This file contains all active tables used in the current version of the application.

-- 0. SYSTEM & LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    username TEXT,
    role TEXT,
    action TEXT,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip_address TEXT
);

CREATE TABLE IF NOT EXISTS system_configs (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT UNIQUE,
    label TEXT,
    color TEXT,
    menus TEXT,
    is_public INTEGER DEFAULT 1
);

-- 1. CORE MODULE
CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stambuk_pondok TEXT,
    stambuk_madrasah TEXT,
    tahun_masuk TEXT,
    kamar TEXT,
    status_mb TEXT,
    madrasah TEXT,
    kelas TEXT,
    nisn TEXT,
    nama_siswa TEXT,
    tempat_tanggal_lahir TEXT,
    jenis_kelamin TEXT,
    agama TEXT,
    kewarganegaraan TEXT,
    anak_ke TEXT,
    alamat TEXT,
    dusun_jalan TEXT,
    desa_kelurahan TEXT,
    kecamatan TEXT,
    kota_kabupaten TEXT,
    provinsi TEXT,
    kode_pos TEXT,
    hobi TEXT,
    cita_cita TEXT,
    asal_sekolah TEXT,
    nama_ayah TEXT,
    tempat_tanggal_lahir_ayah TEXT,
    pendidikan_ayah TEXT,
    pekerjaan_ayah TEXT,
    penghasilan_ayah TEXT,
    no_telp_ayah TEXT,
    nama_ibu TEXT,
    tempat_tanggal_lahir_ibu TEXT,
    pendidikan_ibu TEXT,
    pekerjaan_ibu TEXT,
    penghasilan_ibu TEXT,
    no_telp_ibu TEXT,
    status_santri TEXT,
    tanggal_nonaktif TEXT,
    alasan_nonaktif TEXT,
    foto_santri TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pindah_ke TEXT,
    tahun_pindah TEXT,
    tanggal_boyong TEXT,
    jumlah_saudara TEXT,
    pendidikan_terakhir TEXT,
    no_ijazah TEXT,
    tempat_lahir TEXT,
    tanggal_lahir TEXT
);

CREATE TABLE IF NOT EXISTS ustadz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    foto_ustadz TEXT,
    nama TEXT,
    kelas TEXT,
    alamat TEXT,
    no_hp TEXT,
    status TEXT DEFAULT 'Aktif',
    tanggal_nonaktif TEXT
);

CREATE TABLE IF NOT EXISTS pengurus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    foto_pengurus TEXT,
    nama TEXT,
    jabatan TEXT,
    divisi TEXT,
    no_hp TEXT,
    tahun_mulai TEXT,
    tahun_akhir TEXT,
    status TEXT DEFAULT 'Aktif',
    tanggal_nonaktif TEXT
);

CREATE TABLE IF NOT EXISTS kamar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kamar TEXT,
    asrama TEXT,
    kapasitas INTEGER,
    penasihat TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    fullname TEXT,
    password TEXT NOT NULL,
    password_plain TEXT,
    role TEXT DEFAULT 'absen_pengurus',
    email TEXT,
    no_hp TEXT,
    otp_code TEXT,
    otp_expires DATETIME,
    is_verified INTEGER DEFAULT 0
);

-- 2. KEAMANAN & KETERTIBAN
CREATE TABLE IF NOT EXISTS keamanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE,
    nama_santri TEXT,
    kelas TEXT,
    jenis_pelanggaran TEXT,
    poin INTEGER,
    takzir TEXT,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS izin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    kelas TEXT,
    alasan TEXT,
    tanggal_pulang DATE,
    tanggal_kembali DATE,
    tipe_izin TEXT,
    status_kembali TEXT DEFAULT 'Belum Kembali',
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS keamanan_reg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    kelas TEXT,
    jenis_barang TEXT,
    detail_barang TEXT,
    kamar_penempatan TEXT,
    tanggal_registrasi TEXT,
    petugas_penerima TEXT,
    status_barang_reg TEXT
);

CREATE TABLE IF NOT EXISTS barang_sitaan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    kelas TEXT,
    jenis_barang TEXT,
    nama_barang TEXT,
    petugas TEXT,
    status_barang TEXT,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS keamanan_formal_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER,
    nama_santri TEXT,
    kelompok_formal TEXT,
    kelas_miu TEXT,
    jenjang TEXT,
    semester TEXT
);

-- 3. KESEHATAN (BK)
CREATE TABLE IF NOT EXISTS kesehatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    kelas TEXT,
    mulai_sakit DATE,
    gejala TEXT,
    obat_tindakan TEXT,
    status_periksa TEXT,
    keterangan TEXT
);

-- 4. PENDIDIKAN
CREATE TABLE IF NOT EXISTS pendidikan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE,
    nama_santri TEXT,
    kelas TEXT,
    kegiatan TEXT,
    materi TEXT,
    nilai REAL,
    ustadz TEXT,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS absen_sekolah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER,
    nama_santri TEXT,
    kelas TEXT,
    tanggal DATE,
    kelompok_formal TEXT,
    status TEXT,
    keterangan TEXT,
    petugas TEXT
);

-- 5. KEUANGAN MODULE
CREATE TABLE IF NOT EXISTS keuangan_tarif (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_status TEXT NOT NULL, 
    kelas TEXT DEFAULT 'Semua',    
    nominal INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS keuangan_pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT, 
    tanggal DATE NOT NULL,
    jenis_pembayaran TEXT,
    bulan_tagihan TEXT,
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS keuangan_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE NOT NULL,
    tipe TEXT,
    kategori TEXT, 
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS keuangan_status_santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER,
    nama_santri TEXT,
    kategori_pembayaran TEXT,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS layanan_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE,
    unit TEXT,
    nama_santri TEXT,
    stambuk TEXT,
    jenis_layanan TEXT,
    nominal INTEGER,
    keterangan TEXT,
    pj TEXT,
    pemohon_tipe TEXT,
    jumlah INTEGER
);

-- 6. ARSIPARIS MODULE
CREATE TABLE IF NOT EXISTS arsip_surat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT NOT NULL,
    nomor_surat TEXT NOT NULL,
    tipe TEXT NOT NULL,
    pengirim_penerima TEXT NOT NULL,
    perihal TEXT NOT NULL,
    file_surat TEXT
);

CREATE TABLE IF NOT EXISTS arsip_proposal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT NOT NULL,
    nomor_proposal TEXT NOT NULL,
    judul TEXT NOT NULL,
    pengaju TEXT NOT NULL,
    nominal TEXT NOT NULL,
    status TEXT NOT NULL,
    file_proposal TEXT
);

CREATE TABLE IF NOT EXISTS arsip_akta_tanah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_akta TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    luas_tanah TEXT NOT NULL,
    atas_nama TEXT NOT NULL,
    status_kepemilikan TEXT NOT NULL,
    file_akta TEXT
);

CREATE TABLE IF NOT EXISTS arsip_pengurus_periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periode_mulai TEXT,
    periode_selesai TEXT,
    nama TEXT,
    jabatan TEXT,
    divisi TEXT,
    foto_pengurus TEXT,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS arsip_pengajar_periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periode_mulai TEXT,
    periode_selesai TEXT,
    nama TEXT,
    kelas_ampu TEXT,
    foto_pengajar TEXT,
    keterangan TEXT
);

-- 7. MASTER DATA MODULE
CREATE TABLE IF NOT EXISTS master_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembaga TEXT NOT NULL,
    nama_kelas TEXT NOT NULL,
    urutan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS master_jabatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_jabatan TEXT NOT NULL,
    divisi TEXT
);

CREATE TABLE IF NOT EXISTS master_pembimbing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_jabatan TEXT NOT NULL,
    urutan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS master_kategori_pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kategori TEXT,
    kode TEXT,
    keterangan TEXT,
    urutan INTEGER DEFAULT 0,
    aktif INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS layanan_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit TEXT,
    nama_layanan TEXT,
    harga REAL,
    keterangan TEXT
);

-- 8. WAJAR-MUROTTIL MODULE
CREATE TABLE IF NOT EXISTS wajar_pengurus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_pengurus TEXT NOT NULL,
    kelompok TEXT,
    jabatan TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wajar_kelompok_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER,
    nama_santri TEXT,
    kelompok TEXT,
    pengurus_id INTEGER
);

CREATE TABLE IF NOT EXISTS wajar_mhm_absen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT,
    kelas TEXT,
    kelompok TEXT,
    tanggal DATE NOT NULL,
    status TEXT NOT NULL, -- H, S, I, A
    tipe TEXT NOT NULL, -- 'Wajib Belajar' or 'Murottil Malam'
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wajar_miu_absen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT,
    kelas TEXT,
    kelompok TEXT,
    tanggal DATE NOT NULL,
    status TEXT NOT NULL, -- H, S, I, A
    tipe TEXT DEFAULT 'Murottil Pagi',
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wajar_nilai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT,
    tanggal DATE NOT NULL,
    tipe TEXT NOT NULL, -- 'Murottil Malam', etc
    materi TEXT,
    nilai TEXT,
    keterangan TEXT,
    petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. BENDAHARA (PONDOK) MODULE
CREATE TABLE IF NOT EXISTS arus_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    tipe TEXT,
    kategori TEXT,
    nominal REAL,
    keterangan TEXT,
    pj TEXT
);

CREATE TABLE IF NOT EXISTS kas_unit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    tipe TEXT,
    kategori TEXT,
    nominal REAL,
    keterangan TEXT,
    petugas TEXT
);

-- 10. KEPEGAWAIAN (PENGURUS)
CREATE TABLE IF NOT EXISTS pengurus_target (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pengurus_id INTEGER,
    nama_pengurus TEXT,
    bulan TEXT,
    tahun TEXT,
    target_tugas TEXT,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS pengurus_absen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pengurus_id INTEGER,
    nama_pengurus TEXT,
    bulan TEXT,
    tahun TEXT,
    tugas INTEGER,
    izin INTEGER,
    alfa INTEGER,
    alasan_izin TEXT,
    petugas TEXT
);

-- 10. SECRETARIAT MODULE EXTENSION
CREATE TABLE IF NOT EXISTS kalender_kerja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hari TEXT,
    tanggal_masehi TEXT,
    tanggal_hijriyah TEXT,
    nama_kegiatan TEXT,
    kategori TEXT,
    file_kalender TEXT,
    keterangan TEXT,
    periode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_wajar_mhm_tgl ON wajar_mhm_absen(tanggal, tipe);
CREATE INDEX IF NOT EXISTS idx_wajar_miu_tgl ON wajar_miu_absen(tanggal);
CREATE INDEX IF NOT EXISTS idx_wajar_nilai_tgl ON wajar_nilai(tanggal, tipe);
