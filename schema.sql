-- SIM-PPDS ACTIVE SCHEMA (v2)
-- This file contains all active tables used in the current version of the application.

-- 1. CORE MODULE
CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    foto_santri TEXT,
    stambuk_pondok TEXT,
    stambuk_madrasah TEXT,
    tahun_masuk TEXT,
    kamar TEXT,
    status_mb TEXT,
    madrasah TEXT,
    kelas TEXT,
    nik TEXT,
    nama_siswa TEXT,
    nisn TEXT,
    tempat_tanggal_lahir TEXT,
    jenis_kelamin TEXT,
    agama TEXT,
    hobi TEXT,
    cita_cita TEXT,
    kewarganegaraan TEXT,
    no_kk TEXT,
    nik_ayah TEXT,
    nama_ayah TEXT,
    pekerjaan_ayah TEXT,
    pendidikan_ayah TEXT,
    no_telp_ayah TEXT,
    penghasilan_ayah TEXT,
    nik_ibu TEXT,
    nama_ibu TEXT,
    pekerjaan_ibu TEXT,
    pendidikan_ibu TEXT,
    no_telp_ibu TEXT,
    dusun_jalan TEXT,
    rt_rw TEXT,
    desa_kelurahan TEXT,
    kecamatan TEXT,
    kota_kabupaten TEXT,
    provinsi TEXT,
    kode_pos TEXT,
    status_santri TEXT DEFAULT 'Aktif',
    pindah_ke TEXT,
    tahun_pindah TEXT,
    tanggal_boyong TEXT
);

CREATE TABLE IF NOT EXISTS ustadz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    foto_ustadz TEXT,
    nama TEXT,
    nik_nip TEXT,
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
    role TEXT DEFAULT 'sekretariat'
);

-- 2. KEAMANAN & PENDIDIKAN MODULE
CREATE TABLE IF NOT EXISTS keamanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    jenis_pelanggaran TEXT,
    poin INTEGER,
    takzir TEXT,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS keamanan_reg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
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
    jenis_barang TEXT,
    nama_barang TEXT,
    petugas TEXT,
    status_barang TEXT,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS izin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    alasan TEXT,
    tanggal_pulang TEXT,
    tanggal_kembali TEXT,
    tipe_izin TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS keamanan_absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    nama_santri TEXT,
    kelas TEXT,
    tanggal DATE NOT NULL,
    status TEXT NOT NULL,
    keterangan TEXT,
    petugas TEXT
);

CREATE TABLE IF NOT EXISTS pendidikan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    kegiatan TEXT,
    nilai REAL,
    kehadiran TEXT,
    ustadz TEXT
);

-- 3. KEUANGAN MODULE
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

CREATE TABLE IF NOT EXISTS arus_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    tipe TEXT,
    kategori TEXT,
    nominal REAL,
    keterangan TEXT,
    pj TEXT
);

-- 4. ARSIPARIS MODULE
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

-- 5. MASTER DATA MODULE
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

CREATE TABLE IF NOT EXISTS layanan_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit TEXT,
    nama_layanan TEXT,
    harga REAL,
    keterangan TEXT
);
