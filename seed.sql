-- Dummy Data for SIM-PPDS

-- Insert Santri
INSERT INTO santri (nama_siswa, stambuk_pondok, kamar, kelas, status_santri, tahun_masuk) VALUES 
('Ahmad Fauzi', '2023001', 'Ghozali 01', '10-A', 'Aktif', '2023'),
('Muhammad Ridwan', '2023002', 'Ghozali 02', '11-B', 'Aktif', '2023'),
('Zaidan Al-Fatih', '2024001', 'Syafi''i 03', '10-C', 'Aktif', '2024');

-- Insert Ustadz (Pengajar)
INSERT INTO ustadz (nama, nik_nip, kelas, no_hp, status) VALUES 
('Ustadz Abdul Somad', 'UST-001', 'Fiqih', '081234567890', 'Aktif'),
('Ustadz Adi Hidayat', 'UST-002', 'Tauhid', '081234567891', 'Aktif'),
('Ustadz Hanan Attaki', 'UST-003', 'Akhlak', '081234567892', 'Aktif');

-- Insert Pengurus
INSERT INTO pengurus (nama, jabatan, divisi, no_hp, status) VALUES 
('H. Sulaiman', 'Ketua Pondok', 'Menejerial', '082100001111', 'Aktif'),
('Ustadz Mansur', 'Sekretaris', 'Administrasi', '082100001112', 'Aktif'),
('Ibu Fatimah', 'Bendahara', 'Keuangan', '082100001113', 'Aktif');
