-- SIM-PPDS D1 Schema (SQLite)

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

CREATE TABLE IF NOT EXISTS pendidikan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    kegiatan TEXT,
    nilai REAL,
    kehadiran TEXT,
    keterangan TEXT,
    ustadz TEXT
);

CREATE TABLE IF NOT EXISTS keuangan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    jenis_pembayaran TEXT,
    nominal REAL,
    metode TEXT,
    status TEXT,
    bendahara TEXT,
    tipe TEXT
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

CREATE TABLE IF NOT EXISTS jenis_tagihan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_tagihan TEXT,
    nominal REAL,
    keterangan TEXT,
    aktif INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kamar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kamar TEXT,
    asrama TEXT,
    kapasitas INTEGER,
    penasihat TEXT
);

CREATE TABLE IF NOT EXISTS keamanan_reg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    jenis_barang TEXT,
    detail_barang TEXT,
    jenis_kendaraan TEXT,
    jenis_elektronik TEXT,
    plat_nomor TEXT,
    warna TEXT,
    merk TEXT,
    aksesoris_1 TEXT,
    aksesoris_2 TEXT,
    aksesoris_3 TEXT,
    keadaan TEXT,
    kamar_penempatan TEXT,
    tanggal_registrasi TEXT,
    petugas_penerima TEXT,
    keterangan TEXT,
    status_barang_reg TEXT
);

CREATE TABLE IF NOT EXISTS kesehatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    mulai_sakit TEXT,
    gejala TEXT,
    obat_tindakan TEXT,
    status_periksa TEXT,
    keterangan TEXT,
    biaya_obat REAL
);

CREATE TABLE IF NOT EXISTS izin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_santri TEXT,
    alasan TEXT,
    tanggal_pulang TEXT,
    tanggal_kembali TEXT,
    jam_mulai TEXT,
    jam_selesai TEXT,
    tipe_izin TEXT,
    petugas TEXT,
    keterangan TEXT
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

CREATE TABLE IF NOT EXISTS arsiparis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal_upload TEXT,
    nama_dokumen TEXT,
    kategori TEXT,
    file_url TEXT,
    keterangan TEXT,
    pj TEXT
);

CREATE TABLE IF NOT EXISTS absensi_formal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nama_santri TEXT,
    lembaga TEXT,
    status_absen TEXT,
    keterangan TEXT,
    petugas_piket TEXT
);

CREATE TABLE IF NOT EXISTS layanan_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit TEXT,
    nama_layanan TEXT,
    harga REAL,
    keterangan TEXT,
    aktif INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kas_unit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    unit TEXT,
    tipe TEXT,
    kategori TEXT,
    nominal REAL,
    nama_santri TEXT,
    stambuk TEXT,
    keterangan TEXT,
    petugas TEXT,
    status_setor TEXT
);

CREATE TABLE IF NOT EXISTS layanan_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    unit TEXT,
    nama_santri TEXT,
    stambuk TEXT,
    jenis_layanan TEXT,
    nominal REAL,
    keterangan TEXT,
    pj TEXT,
    pemohon_tipe TEXT,
    jumlah INTEGER
);

CREATE TABLE IF NOT EXISTS lembaga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL
);
