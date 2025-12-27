export const FIELDS_CONFIG = {
    'santri': [
        { section: 'Identitas Utama' },
        { name: 'nama_siswa', label: 'Nama Lengkap Siswa', type: 'text', required: true },
        { name: 'foto_santri', label: 'Foto Santri', type: 'file' },
        { name: 'stambuk_pondok', label: 'Stambuk Pondok', type: 'text' },
        { name: 'stambuk_madrasah', label: 'Stambuk Madrasah', type: 'text' },
        { name: 'nik', label: 'NIK Santri', type: 'text' },
        { name: 'nisn', label: 'NISN', type: 'text' },
        { name: 'tahun_masuk', label: 'Tahun Masuk', type: 'number' },
        { section: 'Akademik & Asrama' },
        { name: 'madrasah', label: 'Madrasah', type: 'select', options: ['MIU', 'MHM'] },
        { name: 'kelas', label: 'Kelas', type: 'select', options: ['I Ula', 'II Ula', 'III Ula', 'I Wustho', 'II Wustho', 'III Wustho', 'I Ulya', 'II Ulya', 'III Ulya', 'V Ibtida\'iyyah', 'VI Ibtida\'iyyah', 'I Tsanawiyyah', 'II Tsanawiyyah', 'III Tsanawiyyah', 'I Aliyyah', 'II Aliyyah', 'III Aliyyah', 'Ma\'had Aly I-II', 'Ma\'had Aly III-IV', 'Ma\'had Aly V-VI', 'II Ma\'had Aly'] },
        { name: 'kamar', label: 'Kamar', type: 'kamar_select' },
        { name: 'status_mb', label: 'Status Santri (Kelompok)', type: 'select', options: ['Biasa Baru', 'Biasa Lama', 'Ndalem 50%', 'Ndalem 100%', 'PKJ 50%', 'PKJ 100%', 'Nduduk', 'Dzuriyyah'] },
        { section: 'Biodata Pribadi' },
        { name: 'tempat_tanggal_lahir', label: 'Tempat, Tgl Lahir', type: 'text' },
        { name: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
        { name: 'agama', label: 'Agama', type: 'text' },
        { name: 'hobi', label: 'Hobi', type: 'text' },
        { name: 'cita_cita', label: 'Cita-cita', type: 'text' },
        { name: 'kewarganegaraan', label: 'Kewarganegaraan', type: 'text' },
        { section: 'Data Keluarga (Ayah)' },
        { name: 'no_kk', label: 'No. KK', type: 'text' },
        { name: 'nik_ayah', label: 'NIK Ayah', type: 'text' },
        { name: 'nama_ayah', label: 'Nama Ayah', type: 'text' },
        { name: 'pekerjaan_ayah', label: 'Pekerjaan Ayah', type: 'text' },
        { name: 'pendidikan_ayah', label: 'Pendidikan Ayah', type: 'text' },
        { name: 'no_telp_ayah', label: 'No. Telp Ayah', type: 'text' },
        { name: 'penghasilan_ayah', label: 'Penghasilan Ayah', type: 'text' },
        { section: 'Data Keluarga (Ibu)' },
        { name: 'nik_ibu', label: 'NIK Ibu', type: 'text' },
        { name: 'nama_ibu', label: 'Nama Ibu', type: 'text' },
        { name: 'pekerjaan_ibu', label: 'Pekerjaan Ibu', type: 'text' },
        { name: 'pendidikan_ibu', label: 'Pendidikan Ibu', type: 'text' },
        { name: 'no_telp_ibu', label: 'No. Telp Ibu', type: 'text' },
        { section: 'Alamat Lengkap' },
        { name: 'dusun_jalan', label: 'Dusun/Jalan', type: 'text' },
        { name: 'rt_rw', label: 'RT/RW', type: 'text' },
        { name: 'desa_kelurahan', label: 'Desa/Kelurahan', type: 'text' },
        { name: 'kecamatan', label: 'Kecamatan', type: 'text' },
        { name: 'kota_kabupaten', label: 'Kota/Kabupaten', type: 'text' },
        { name: 'provinsi', label: 'Provinsi', type: 'text' },
        { name: 'kode_pos', label: 'Kode Pos', type: 'text' },
    ],
    'ustadz': [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'foto_ustadz', label: 'Foto Ustadz', type: 'file' },
        { name: 'nik_nip', label: 'NIK / NIP', type: 'text' },
        { name: 'kelas', label: 'Kelas', type: 'select', options: ['I Ula', 'II Ula', 'III Ula', 'I Wustho', 'II Wustho', 'III Wustho', 'I Ulya', 'II Ulya', 'III Ulya', 'V Ibtida\'iyyah', 'VI Ibtida\'iyyah', 'I Tsanawiyyah', 'II Tsanawiyyah', 'III Tsanawiyyah', 'I Aliyyah', 'II Aliyyah', 'III Aliyyah', 'Ma\'had Aly I-II', 'Ma\'had Aly III-IV', 'Ma\'had Aly V-VI', 'II Ma\'had Aly'] },
        { name: 'no_hp', label: 'No. HP', type: 'text' },
        { name: 'alamat', label: 'Alamat', type: 'text' },
        { name: 'status', label: 'Status Keaktifan', type: 'select', options: ['Aktif', 'Non-Aktif'], required: true, default: 'Aktif' },
        { name: 'tanggal_nonaktif', label: 'Tanggal Non-Aktif', type: 'date' }
    ],
    'pengurus': [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'foto_pengurus', label: 'Foto Pengurus', type: 'file' },
        { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Dewan Harian', 'Dewan Pleno'] },
        {
            name: 'tahun_mulai',
            label: 'Mulai Menjabat (Tahun)',
            type: 'select',
            options: [
                '2025/2026', '2026/2027', '2027/2028', '2028/2029', '2029/2030',
                '2030/2031', '2031/2032', '2032/2033', '2033/2034', '2034/2035'
            ]
        },
        {
            name: 'divisi', label: 'Divisi / Bidang', type: 'select', options: [
                'Ketua Umum', 'Ketua I', 'Ketua II', 'Ketua III',
                'Sekretaris Umum', 'Sekretaris I', 'Sekretaris II', 'Sekretaris III',
                'Bendahara Umum', 'Bendahara I', 'Bendahara II',
                'Pendidikan', 'Wajar & Murottil', 'Keamanan',
                "Jam'iyyah", 'Keuangan', 'PLP',
                'Humasy Logistik', 'KBR', 'Blok',
                'Pembangunan', 'Tim Dok', 'Takmir Masjid',
                'Kesehatan', 'BUMP'
            ]
        },
        { name: 'no_hp', label: 'No. HP', type: 'text' },
        { name: 'status', label: 'Status Keaktifan', type: 'select', options: ['Aktif', 'Non-Aktif'], required: true, default: 'Aktif' },
        { name: 'tanggal_nonaktif', label: 'Tanggal Non-Aktif', type: 'date' }
    ],
    'keamanan': [
        { name: 'tanggal', label: 'Tanggal Kejadian', type: 'date', required: true },
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'jenis_pelanggaran', label: 'Jenis Pelanggaran', type: 'select', options: ['Ringan', 'Sedang', 'Berat'] },
        { name: 'poin', label: 'Poin', type: 'number' },
        { name: 'takzir', label: 'Takzir / Sanksi', type: 'text' },
        { name: 'keterangan', label: 'Kronologis / Keterangan', type: 'text' },
        { name: 'petugas', label: 'Petugas Keamanan', type: 'keamanan_select' }
    ],
    'pendidikan': [
        { name: 'tanggal', label: 'Tanggal Input', type: 'date', required: true },
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'kegiatan', label: 'Kegiatan', type: 'select', options: ['Musyawaroh', 'Sorogan', 'Wajib Belajar', 'Murottil Pagi', 'Murottil Malam', 'Talaqqi'] },
        { name: 'nilai', label: 'Nilai', type: 'number' },
        { name: 'kehadiran', label: 'Absensi', type: 'select', options: ['Hadir', 'Sakit', 'Izin', 'Tanpa Keterangan'] },
        { name: 'keterangan', label: 'Keterangan', type: 'text' },
        { name: 'ustadz', label: 'Nama Pengajar', type: 'pendidikan_select' }
    ],
    'keuangan': [
        { name: 'tanggal', label: 'Tanggal Transaksi', type: 'date', required: true },
        { name: 'nama_santri', label: 'Nama Santri / Keterangan', type: 'santri_search', required: true },
        { name: 'jenis_pembayaran', label: 'Jenis Pembayaran', type: 'select', options: ['Syahriah', 'Perawatan sarana', 'Listrik', 'Kebersihan', 'Kesehatan', 'Pembangunan'] },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number' },
        { name: 'metode', label: 'Metode', type: 'select', options: ['Tunai', 'Transfer'] },
        { name: 'status', label: 'Status Lunas', type: 'select', options: ['Lunas', 'Belum Lunas'] },
        { name: 'bendahara', label: 'Nama Petugas', type: 'bendahara_select' },
        { name: 'tipe', label: 'Tipe (Input/Output)', type: 'select', options: ['Masuk', 'Keluar'] }
    ],
    'arus_kas': [
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
        { name: 'tipe', label: 'Jenis Arus', type: 'select', options: ['Masuk', 'Keluar'], required: true },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number', required: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['Syahriah', 'Perawatan sarana', 'Listrik', 'Kebersihan', 'Kesehatan', 'Pembangunan'] },
        { name: 'keterangan', label: 'Keterangan Detail', type: 'text' },
        { name: 'pj', label: 'Penanggung Jawab', type: 'bendahara_select' }
    ],
    'jenis_tagihan': [
        { name: 'nama_tagihan', label: 'Nama Tagihan', type: 'text', required: true },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number', required: true },
        { name: 'keterangan', label: 'Kelompok Pembayaran', type: 'select', options: ['Biasa Baru', 'Biasa Lama', 'Ndalem 50%', 'Ndalem 100%', 'PKJ 50%', 'PKJ 100%', 'Nduduk', 'Dzuriyyah'] },
        { name: 'aktif', label: 'Status Aktif', type: 'select', options: ['Aktif', 'Non-Aktif'] }
    ],
    'kamar': [
        { name: 'nama_kamar', label: 'Nama Kamar', type: 'text', required: true },
        { name: 'asrama', label: 'Asrama / Lokasi Blok', type: 'select', options: ['DS A', 'DS B', 'DS C'], required: true },
        { name: 'kapasitas', label: 'Kapasitas (Orang)', type: 'number', required: true },
        { name: 'penasihat', label: 'Penasihat Kamar', type: 'penasihat_select' }
    ],
    'keamanan_reg': [
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search' },
        { name: 'jenis_barang', label: 'Jenis Barang', type: 'select', options: ['Kendaraan', 'Elektronik', 'Kompor'], required: true },
        { name: 'detail_barang', label: 'Tipe Detail', type: 'text' },
        { name: 'jenis_kendaraan', label: 'Jenis Kendaraan', type: 'select', options: ['Motor', 'Ontel', 'Lainnya'] },
        { name: 'jenis_elektronik', label: 'Jenis Elektronik', type: 'select', options: ['Handphone', 'Laptop', 'Flashdisk', 'Lainnya'] },
        { name: 'merk', label: 'Merk / Brand', type: 'text' },
        { name: 'warna', label: 'Warna', type: 'text' },
        { name: 'plat_nomor', label: 'No. Plat (Kendaraan)', type: 'text' },
        { name: 'aksesoris_1', label: 'Aksesoris 1', type: 'text' },
        { name: 'aksesoris_2', label: 'Aksesoris 2', type: 'text' },
        { name: 'aksesoris_3', label: 'Aksesoris 3', type: 'text' },
        { name: 'keadaan', label: 'Keadaan Barang', type: 'select', options: ['Sangat Baik', 'Baik', 'Normal', 'Rusak Ringan', 'Rusak Berat'] },
        { name: 'status_barang_reg', label: 'Status Barang (Baru/Lama)', type: 'select', options: ['Baru', 'Lama'], default: 'Baru' },
        { name: 'kamar_penempatan', label: 'Kamar Penempatan', type: 'kamar_select' },
        { name: 'tanggal_registrasi', label: 'Tanggal Registrasi', type: 'date', required: true },
        { name: 'petugas_penerima', label: 'Keamanan Penerima', type: 'keamanan_select', required: true },
        { name: 'keterangan', label: 'Keterangan Tambahan', type: 'text' }
    ],
    'kesehatan': [
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'mulai_sakit', label: 'Mulai Sakit', type: 'date', required: true },
        { name: 'gejala', label: 'Gejala / Keluhan', type: 'text', required: true },
        { name: 'obat_tindakan', label: 'Obat / Tindakan', type: 'text' },
        { name: 'biaya_obat', label: 'Biaya Obat (Rp)', type: 'number', default: 0 },
        { name: 'status_periksa', label: 'Status / Periksa', type: 'select', options: ['Rawat Inap', 'Rawat Jalan', 'Periksa Luar', 'Sembuh'] },
        { name: 'keterangan', label: 'Keterangan Tambahan', type: 'text' }
    ],
    'users': [
        { name: 'fullname', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'username', label: 'Username (ID)', type: 'text', required: true },
        { name: 'password', label: 'Kata Sandi', type: 'text', required: true },
        { name: 'role', label: 'Peran / Unit', type: 'select', options: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu'], required: true }
    ],
    'izin': [
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'alasan', label: 'Alasan Izin', type: 'select', options: ['Pulang', 'Keluar', 'Izin Sekolah', 'Izin Kegiatan'], required: true },
        { name: 'tanggal_pulang', label: 'Tgl Dari', type: 'date' },
        { name: 'tanggal_kembali', label: 'Tgl Sampai', type: 'date' },
        { name: 'jam_mulai', label: 'Jam Mulai', type: 'time' },
        { name: 'jam_selesai', label: 'Jam Selesai', type: 'time' },
        { name: 'tipe_izin', label: 'Tipe Izin', type: 'text' },
        { name: 'petugas', label: 'Petugas / PJ', type: 'penasihat_select', required: true },
        { name: 'keterangan', label: 'Keterangan Detail', type: 'text' }
    ],
    'barang_sitaan': [
        { name: 'tanggal', label: 'Tanggal Sita', type: 'date', required: true },
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'jenis_barang', label: 'Jenis Barang', type: 'select', options: ['Elektronik Terlarang', 'Senjata Tajam', 'Rokok/Obat', 'Pakaian Non-Standar', 'Lainnya'], required: true },
        { name: 'nama_barang', label: 'Nama/Merk Barang', type: 'text', required: true },
        { name: 'petugas', label: 'Petugas Penyita', type: 'keamanan_select', required: true },
        { name: 'status_barang', label: 'Status Barang', type: 'select', options: ['Disita', 'Dihancurkan', 'Dikembalikan', 'PROSES'], default: 'Disita' },
        { name: 'keterangan', label: 'Keterangan / Alasan', type: 'text' }
    ],
    'absensi_formal': [
        { name: 'tanggal', label: 'Tanggal Absensi', type: 'date', required: true },
        { name: 'nama_santri', label: 'Nama Santri', type: 'santri_search', required: true },
        { name: 'lembaga', label: 'Lembaga Sekolah', type: 'select', options: ['SD', 'SMP', 'MTs', 'SMA', 'MA', 'SMK', 'Kuliah', 'Lainnya'] },
        { name: 'status_absen', label: 'Status Kehadiran', type: 'select', options: ['Hadir', 'Sakit', 'Izin', 'Alfa/Tanpa Keterangan'] },
        { name: 'keterangan', label: 'Keterangan Tambahan', type: 'text' },
        { name: 'petugas_piket', label: 'Petugas Keamanan (Piket)', type: 'keamanan_select' }
    ],
    'layanan_info': [
        { name: 'unit', label: 'Unit / Seksi', type: 'select', options: ['Keamanan', 'Pendidikan', 'Kesehatan', 'Sekretariat', "Jam'iyyah"], required: true },
        {
            name: 'nama_layanan',
            label: 'Nama Layanan/Barang',
            type: 'datalist',
            options: [
                'Motor Baru', 'Motor Lama', 'Ontel Baru', 'Ontel Lama', 'Hp', 'Laptop', 'Flashdisk', 'Kompor',
                'Izin Pulang', 'Izin Keluar', 'Izin Sekolah', 'Izin Sakit',
                'KTK', 'SIM', 'KTS', 'Surat Domisili', 'Surat Pindah', 'Surat Boyong',
                'Alat Rebana 1 Set', 'Alat Rebana Perbiji'
            ],
            required: true
        },
        { name: 'harga', label: 'Nominal Harga (Rp)', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'text' },
        { name: 'aktif', label: 'Status Aktif', type: 'select', options: ['Aktif', 'Non-Aktif'], default: 'Aktif' }
    ],
    'kas_unit': [
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
        { name: 'unit', label: 'Unit', type: 'select', options: ['Keamanan', 'Pendidikan', 'Kesehatan', 'Sekretariat', "Jam'iyyah"] },
        { name: 'tipe', label: 'Tipe', type: 'select', options: ['Masuk', 'Keluar'] },
        {
            name: 'kategori',
            label: 'Kategori / Keperluan',
            type: 'datalist',
            options: [
                'Setoran Unit', 'Pembelian ATK', 'Biaya Transport', 'Konsumsi Rapat', 'Uang Saku Petugas',
                'Sewa Alat', 'Beli Sabun/Kebersihan', 'Perbaikan Fasilitas', 'Honor Ustadz'
            ]
        },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number' },
        { name: 'nama_santri', label: 'Nama Santri (Opsional)', type: 'santri_search' },
        { name: 'keterangan', label: 'Keterangan Detail', type: 'text' },
        { name: 'petugas', label: 'Petugas PJ', type: 'text' },
        { name: 'status_setor', label: 'Status Setoran', type: 'select', options: ['Belum Setor', 'Proses Setor', 'Sudah Diterima Bendahara'], default: 'Belum Setor' }
    ],
    'layanan_admin': [
        { name: 'tanggal', label: 'Tanggal Layanan', type: 'date', required: true },
        { name: 'unit', label: 'Unit / Seksi', type: 'select', options: ['Keamanan', 'Pendidikan', 'Kesehatan', 'Sekretariat', "Jam'iyyah"], required: true },
        { name: 'pemohon_tipe', label: 'Tipe Pemohon', type: 'lembaga_select' },
        { name: 'nama_santri', label: 'Nama Santri / Pemohon', type: 'santri_search' },
        {
            name: 'jenis_layanan',
            label: 'Jenis Layanan',
            type: 'datalist',
            options: [], // Populated dynamically
            required: true
        },
        { name: 'jumlah', label: 'Jumlah / Satuan', type: 'text', default: '1' },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number' },
        { name: 'keterangan', label: 'Keterangan', type: 'text' },
        { name: 'pj', label: 'Penanggung Jawab', type: 'sekretaris_select' }
    ]
};

export const SYSTEM_PRICES = {
    // KEAMANAN
    'Izin Keluar': 2000,
    'Izin Pulang': 2000,
    'Video Call': 3000,
    'Telfon biasa': 2000,
    'Motor Baru': 50000,
    'Motor Lama': 40000,
    'Ontel Lama': 20000,
    'Ontel Baru': 25000,
    'Hp': 50000,
    'Laptop': 50000,
    'Surat kehilangan': 10000,
    'Paket/item': 2000,
    'Flashdisk': 5000,
    'Kompor': 20000,
    // PENDIDIKAN
    'Izin Sekolah': 2000,
    // KESEHATAN
    'Izin Sakit': 2000,
    // SEKRETARIS
    'KTK': 15000,
    'SIM': 15000,
    'KTS': 4000,
    'Surat Domisili': 3000,
    'Surat Pindah': 15000,
    'Surat Boyong': 15000,
    // JAM'IYYAH
    "Alat Rebana 1 Set": 30000,
    "Alat Rebana Perbiji": 3000
};
