-- DATA UJI COBA KOMPREHENSIF SIM-PPDS (Separated Name/Class)
DELETE FROM santri WHERE stambuk_pondok LIKE 'TEST%';

-- 1. DATA SANTRI (9 Santri: 3 MIU, 3 MHM, 3 Pengurus/Aktif Lainnya)
INSERT INTO santri (stambuk_pondok, nama_siswa, madrasah, kelas, kamar, status_santri, tahun_masuk, jenis_kelamin, foto_santri) VALUES 
('TEST001', 'Ahmad MIU Ula 1', 'MIU', 'I Ula', 'Ghozali 01', 'Aktif', '2024', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'),
('TEST002', 'Budi MIU Wustho 2', 'MIU', 'II Wustho', 'Ghozali 01', 'Aktif', '2024', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi'),
('TEST003', 'Citra MIU Ulya 3', 'MIU', 'III Ulya', 'Fatimah 02', 'Aktif', '2023', 'Perempuan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Citra'),
('TEST004', 'Dedi MHM Ibtida 4', 'MHM', 'IV Ibtida''iyyah', 'Syafi''i 03', 'Aktif', '2021', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dedi'),
('TEST005', 'Eka MHM Ibtida 5', 'MHM', 'V Ibtida''iyyah', 'Syafi''i 03', 'Aktif', '2021', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka'),
('TEST006', 'Fafa MHM Ibtida 6', 'MHM', 'VI Ibtida''iyyah', 'Fatimah 04', 'Aktif', '2020', 'Perempuan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fafa'),
('TEST007', 'Gani Senior MHM Aliyah', 'MHM', 'II Aliyyah', 'Maliki 05', 'Aktif', '2019', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gani'),
('TEST008', 'Hadi Senior MHM Aly', 'MHM', 'Ma''had Aly III', 'Maliki 05', 'Aktif', '2018', 'Laki-laki', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hadi'),
('TEST009', 'Indah Boarding MIU', 'MIU', 'I Wustho', 'Fatimah 02', 'Aktif', '2024', 'Perempuan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Indah');

-- 2. KETERKAITAN DATA

-- A. KEAMANAN (Pelanggaran & Izin)
INSERT INTO keamanan (tanggal, nama_santri, kelas, jenis_pelanggaran, poin, takzir, petugas) VALUES
('2024-12-28', 'Ahmad MIU Ula 1', 'I Ula', 'Telat Berjamaah', 5, 'Bersih Kamar Mandi', 'Keamanan 1'),
('2024-12-28', 'Dedi MHM Ibtida 4', 'IV Ibtida''iyyah', 'Keluar Tanpa Izin', 15, 'Gundul', 'Keamanan 2'),
('2024-12-28', 'Gani Senior MHM Aliyah', 'II Aliyyah', 'Membawa HP', 50, 'Sita & Skors', 'Keamanan 1');

INSERT INTO izin (nama_santri, kelas, alasan, tanggal_pulang, tanggal_kembali, tipe_izin, petugas) VALUES
('Budi MIU Wustho 2', 'II Wustho', 'Sakit', '2024-12-28', '2024-12-30', 'Pulang', 'Pengurus Izin'),
('Eka MHM Ibtida 5', 'V Ibtida''iyyah', 'Kepentingan Keluarga', '2024-12-27', '2024-12-28', 'Izin Keluar', 'Pengurus Izin');

-- B. KESEHATAN (BK)
INSERT INTO kesehatan (nama_santri, kelas, mulai_sakit, gejala, obat_tindakan, status_periksa) VALUES
('Ahmad MIU Ula 1', 'I Ula', '2024-12-27', 'Demam & Pusing', 'Paracetamol', 'Rawat Inap'),
('Hadi Senior MHM Aly', 'Ma''had Aly III', '2024-12-28', 'Sakit Gigi', 'Antalgin', 'Rawat Jalan');

-- C. PENDIDIKAN (Nilai Akademik)
INSERT INTO pendidikan (tanggal, nama_santri, kelas, kegiatan, nilai, ustadz, materi) VALUES
('2024-12-28', 'Citra MIU Ulya 3', 'III Ulya', 'Ujian Fiqih', 85.5, 'Ustadz Zaid', 'Bab Thoharoh'),
('2024-12-28', 'Fafa MHM Ibtida 6', 'VI Ibtida''iyyah', 'Imtihan Nahwu', 92.0, 'Ustadz Bakri', 'Alfiyah Ibnu Malik'),
('2024-12-28', 'Indah Boarding MIU', 'I Wustho', 'Setoran Hafalan', 78.0, 'Ustadzah Aminah', 'Juz 30');

-- D. KEUANGAN
INSERT INTO keuangan_pembayaran (santri_id, nama_santri, tanggal, jenis_pembayaran, nominal, petugas) VALUES
((SELECT id FROM santri WHERE stambuk_pondok='TEST001'), 'Ahmad MIU Ula 1', '2024-12-01', 'Syahriah', 500000, 'Bendahara 1'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST004'), 'Dedi MHM Ibtida 4', '2024-12-05', 'Syahriah', 450000, 'Bendahara 1'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST007'), 'Gani Senior MHM Aliyah', '2024-12-10', 'Syahriah', 500000, 'Bendahara 2');

-- E. WAJAR-MUROTTIL
INSERT INTO wajar_miu_absen (santri_id, nama_santri, kelas, tanggal, status, tipe, petugas) VALUES
((SELECT id FROM santri WHERE stambuk_pondok='TEST001'), 'Ahmad MIU Ula 1', 'I Ula', '2024-12-28', 'H', 'Murottil Pagi', 'Ust. Wajar'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST002'), 'Budi MIU Wustho 2', 'II Wustho', '2024-12-28', 'S', 'Murottil Pagi', 'Ust. Wajar'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST009'), 'Indah Boarding MIU', 'I Wustho', '2024-12-28', 'H', 'Murottil Pagi', 'Ust. Wajar');

INSERT INTO wajar_mhm_absen (santri_id, nama_santri, kelas, tanggal, status, tipe, petugas) VALUES
((SELECT id FROM santri WHERE stambuk_pondok='TEST004'), 'Dedi MHM Ibtida 4', 'IV Ibtida''iyyah', '2024-12-28', 'H', 'Wajib Belajar', 'Ust. Wajar'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST005'), 'Eka MHM Ibtida 5', 'V Ibtida''iyyah', '2024-12-28', 'H', 'Murottil Malam', 'Ust. Wajar'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST006'), 'Fafa MHM Ibtida 6', 'VI Ibtida''iyyah', '2024-12-28', 'A', 'Murottil Malam', 'Ust. Wajar');

INSERT INTO wajar_nilai (santri_id, nama_santri, tanggal, tipe, materi, nilai, petugas) VALUES
((SELECT id FROM santri WHERE stambuk_pondok='TEST005'), 'Eka MHM Ibtida 5', '2024-12-28', 'Murottil Malam', 'An-Naba 1-10', 'Jayyid', 'Ust. Wajar'),
((SELECT id FROM santri WHERE stambuk_pondok='TEST004'), 'Dedi MHM Ibtida 4', '2024-12-28', 'Murottil Malam', 'Al-Mulk 1-5', 'Maqbul', 'Ust. Wajar');
