# Panduan Implementasi Halaman Arsip

## Halaman yang Sudah Selesai ✅
1. ✅ Alumni Santri
2. ✅ Mutasi Santri (Boyong/Pindah)
3. ✅ Surat Masuk/Keluar

## Halaman yang Perlu Dibuat 📋

### 4. Proposal
**File**: `src/app/arsip/proposal/page.js`
**Database Table**: `arsip_proposal`
**Fields**: 
- tanggal, nomor_proposal, judul, pengaju, nominal, status, file_proposal, keterangan

**Pattern**: Copy dari `surat/page.js`, ganti fields sesuai kebutuhan

### 5. Akta Tanah
**File**: `src/app/arsip/akta-tanah/page.js`
**Database Table**: `arsip_akta_tanah`
**Fields**:
- nomor_akta, tanggal, lokasi, luas_tanah, atas_nama, status_kepemilikan, file_akta, keterangan

**Pattern**: Copy dari `surat/page.js`, ganti fields sesuai kebutuhan

### 6. Pengurus (Per-Periode)
**File**: `src/app/arsip/pengurus-periode/page.js`
**Database Table**: `arsip_pengurus_periode`
**Fields**:
- periode_mulai, periode_selesai, nama, jabatan, divisi, foto_pengurus, keterangan

**Pattern**: Copy dari `alumni/page.js`, tambahkan filter periode

### 7. Pengajar (Per-Periode)
**File**: `src/app/arsip/pengajar-periode/page.js`
**Database Table**: `arsip_pengajar_periode`
**Fields**:
- periode_mulai, periode_selesai, nama, kelas_ampu, foto_pengajar, keterangan

**Pattern**: Copy dari `alumni/page.js`, tambahkan filter periode

## Database Schema untuk API Route

Tambahkan ke `src/app/api/route.js` di `headersConfig`:

```javascript
'arsip_surat': ["tanggal", "nomor_surat", "tipe", "pengirim_penerima", "perihal", "keterangan", "file_surat"],
'arsip_proposal': ["tanggal", "nomor_proposal", "judul", "pengaju", "nominal", "status", "file_proposal", "keterangan"],
'arsip_akta_tanah': ["nomor_akta", "tanggal", "lokasi", "luas_tanah", "atas_nama", "status_kepemilikan", "file_akta", "keterangan"],
'arsip_pengurus_periode': ["periode_mulai", "periode_selesai", "nama", "jabatan", "divisi", "foto_pengurus", "keterangan"],
'arsip_pengajar_periode': ["periode_mulai", "periode_selesai", "nama", "kelas_ampu", "foto_pengajar", "keterangan"]
```

## SQL untuk Membuat Tabel di Cloudflare D1

```sql
-- Tabel Arsip Surat
CREATE TABLE IF NOT EXISTS arsip_surat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nomor_surat TEXT,
    tipe TEXT,
    pengirim_penerima TEXT,
    perihal TEXT,
    keterangan TEXT,
    file_surat TEXT
);

-- Tabel Arsip Proposal
CREATE TABLE IF NOT EXISTS arsip_proposal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    nomor_proposal TEXT,
    judul TEXT,
    pengaju TEXT,
    nominal TEXT,
    status TEXT,
    file_proposal TEXT,
    keterangan TEXT
);

-- Tabel Arsip Akta Tanah
CREATE TABLE IF NOT EXISTS arsip_akta_tanah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor_akta TEXT,
    tanggal TEXT,
    lokasi TEXT,
    luas_tanah TEXT,
    atas_nama TEXT,
    status_kepemilikan TEXT,
    file_akta TEXT,
    keterangan TEXT
);

-- Tabel Arsip Pengurus Periode
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

-- Tabel Arsip Pengajar Periode
CREATE TABLE IF NOT EXISTS arsip_pengajar_periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periode_mulai TEXT,
    periode_selesai TEXT,
    nama TEXT,
    kelas_ampu TEXT,
    foto_pengajar TEXT,
    keterangan TEXT
);
```

## Cara Implementasi Cepat

1. Copy file `surat/page.js` untuk Proposal dan Akta Tanah
2. Ganti nama komponen, fields, dan labels
3. Copy file `alumni/page.js` untuk Pengurus dan Pengajar Periode
4. Tambahkan filter periode
5. Update API route dengan schema baru
6. Jalankan SQL di Cloudflare D1 Console

Semua halaman sudah menggunakan SortableTable component!
