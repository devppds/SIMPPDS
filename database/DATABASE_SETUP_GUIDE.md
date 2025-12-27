# 🗄️ Database Setup Guide - Arsiparis Module

## Cara Setup Database di Cloudflare D1

### Metode 1: Via Cloudflare Dashboard (RECOMMENDED)

1. **Login ke Cloudflare Dashboard**
   - Buka: https://dash.cloudflare.com
   - Pilih akun Kamu

2. **Buka D1 Database**
   - Sidebar kiri → **Workers & Pages**
   - Pilih tab **D1**
   - Pilih database Kamu (biasanya nama: `simppds-db` atau sesuai wrangler.toml)

3. **Buka Console**
   - Klik database Kamu
   - Klik tab **Console**

4. **Execute SQL**
   - Copy semua isi file `database/arsiparis_setup.sql`
   - Paste ke Console
   - Klik **Execute** atau tekan Ctrl+Enter

5. **Verifikasi**
   - Jalankan query verifikasi di bagian bawah file SQL
   - Pastikan semua tabel terbuat

### Metode 2: Via Wrangler CLI (ADVANCED)

```bash
# Pastikan sudah login
npx wrangler login

# Execute SQL file
npx wrangler d1 execute simppds-db --file=database/arsiparis_setup.sql --remote

# Atau execute per tabel
npx wrangler d1 execute simppds-db --command="CREATE TABLE IF NOT EXISTS arsip_surat (...)" --remote
```

## 📋 Tabel yang Dibuat

### 1. arsip_surat
**Fungsi**: Menyimpan arsip surat masuk dan keluar
**Fields**:
- id, tanggal, nomor_surat, tipe (Masuk/Keluar)
- pengirim_penerima, perihal, keterangan, file_surat
- created_at, updated_at

### 2. arsip_proposal
**Fungsi**: Menyimpan arsip proposal kegiatan/pembangunan
**Fields**:
- id, tanggal, nomor_proposal, judul, pengaju
- nominal, status (Diajukan/Disetujui/Ditolak)
- file_proposal, keterangan, created_at, updated_at

### 3. arsip_akta_tanah
**Fungsi**: Menyimpan arsip kepemilikan tanah pondok
**Fields**:
- id, nomor_akta, tanggal, lokasi, luas_tanah
- atas_nama, status_kepemilikan (Milik Pondok/Wakaf/Sewa)
- file_akta, keterangan, created_at, updated_at

### 4. arsip_pengurus_periode
**Fungsi**: Menyimpan arsip pengurus per periode kepengurusan
**Fields**:
- id, periode_mulai, periode_selesai, nama, jabatan
- divisi, foto_pengurus, keterangan, created_at, updated_at

### 5. arsip_pengajar_periode
**Fungsi**: Menyimpan arsip pengajar per periode mengajar
**Fields**:
- id, periode_mulai, periode_selesai, nama, kelas_ampu
- foto_pengajar, keterangan, created_at, updated_at

## ✅ Verifikasi Setup

Setelah execute SQL, jalankan query ini untuk verifikasi:

```sql
-- Cek semua tabel
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'arsip_%';

-- Cek jumlah data
SELECT 'arsip_surat' as tabel, COUNT(*) as jumlah FROM arsip_surat
UNION ALL
SELECT 'arsip_proposal', COUNT(*) FROM arsip_proposal
UNION ALL
SELECT 'arsip_akta_tanah', COUNT(*) FROM arsip_akta_tanah
UNION ALL
SELECT 'arsip_pengurus_periode', COUNT(*) FROM arsip_pengurus_periode
UNION ALL
SELECT 'arsip_pengajar_periode', COUNT(*) FROM arsip_pengajar_periode;
```

## 🎯 Sample Data

File SQL sudah include sample data untuk testing:
- 2 surat (1 masuk, 1 keluar)
- 2 proposal (1 disetujui, 1 diajukan)
- 2 akta tanah (1 milik pondok, 1 wakaf)

Kamu bisa hapus sample data jika tidak diperlukan:

```sql
DELETE FROM arsip_surat;
DELETE FROM arsip_proposal;
DELETE FROM arsip_akta_tanah;
```

## 🚀 Testing

Setelah setup, test dengan:

1. **Buka halaman Arsiparis** di dashboard
2. **Coba tambah data** di halaman Surat/Proposal/Akta Tanah
3. **Verifikasi** data muncul di tabel

## 🔧 Troubleshooting

### Error: "table already exists"
- Tidak masalah, artinya tabel sudah ada
- SQL menggunakan `IF NOT EXISTS` jadi aman

### Error: "no such table"
- Pastikan execute di database yang benar
- Cek nama database di wrangler.toml

### Data tidak muncul di dashboard
- Refresh halaman
- Cek console browser untuk error
- Pastikan API route sudah diupdate (sudah done ✅)

## 📝 Notes

- Semua tabel sudah punya indexes untuk performa optimal
- Timestamps otomatis (created_at, updated_at)
- Constraints untuk data integrity (CHECK, NOT NULL)
- Sample data bisa dihapus atau dimodifikasi sesuai kebutuhan

**Database setup selesai! Modul Arsiparis siap digunakan!** 🎉
