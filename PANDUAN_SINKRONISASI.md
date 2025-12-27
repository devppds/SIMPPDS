# PANDUAN SINKRONISASI DATABASE SANTRI - LENGKAP

## ✅ Yang Sudah Selesai:

### 1. Schema Database (schema.sql)
- ✅ Diperbarui dengan 76 kolom lengkap sesuai database remote
- ✅ Semua field dari remote sudah tercakup

### 2. API Configuration (src/app/api/route.js)
- ✅ headersConfig untuk 'santri' sudah diperbarui dengan 76 kolom
- ✅ Semua field akan diterima dan disimpan dengan benar

### 3. Form State (src/app/sekretariat/santri/page.js)
- ✅ formData state sudah diperbarui dengan semua field
- ✅ Reset state di openModal sudah disesuaikan

### 4. Modal Tabs
- ✅ Tab navigation sudah ditambahkan (7 tabs):
  1. Identitas (Pondok)
  2. Pribadi (Data Diri)
  3. Pendidikan (Sekolah Asal)
  4. Wali/Ortu (Ayah, Ibu, Wali)
  5. Alamat (Domisili)
  6. Bantuan (KIP, KKS, dll)
  7. Status (Foto & Berkas)

## 🔧 Yang Perlu Dilakukan Manual:

### Langkah 1: Update Tab Content di santri/page.js

Buka file: `src/app/sekretariat/santri/page.js`

Cari bagian yang dimulai dengan:
```javascript
<div style={{ marginTop: '1.5rem' }}>
    {activeTab === 'umum' && (
```

**Ganti seluruh konten dari baris ~432 sampai ~517** dengan konten yang ada di file:
`FORM_TABS_COMPLETE.txt`

### Langkah 2: Verifikasi Cloudinary Configuration

Pastikan environment variables Cloudinary sudah terset di Cloudflare Dashboard:
1. Buka Cloudflare Dashboard
2. Pilih Workers & Pages → sim-ppds-5dv
3. Settings → Variables and Secrets
4. Pastikan ada 3 variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Langkah 3: Test Upload Foto

Setelah deployment:
1. Buka halaman Data Santri
2. Klik "Tambah Baru"
3. Isi data minimal (Nama, Kelas, Kamar)
4. Ke tab "Status"
5. Upload foto
6. Simpan

## 📋 Field Mapping (76 Kolom Total):

### Identitas Pondok (8 fields):
- stambuk_pondok, stambuk_madrasah, tahun_masuk, kamar, status_mb, madrasah, kelas

### Identitas Pribadi (15 fields):
- nik, nama_siswa, nisn, tempat_lahir, tanggal_lahir, tempat_tanggal_lahir
- jenis_kelamin, agama, kewarganegaraan, anak_ke, jumlah_saudara
- tinggi_badan, berat_badan, golongan_darah, penyakit_khusus

### Minat & Bakat (2 fields):
- hobi, cita_cita

### Pendidikan Sebelumnya (6 fields):
- asal_sekolah, npsn, alamat_sekolah, no_ijazah_skhun, no_peserta_ujian, tahun_lulus

### Alamat (8 fields):
- alamat_lengkap, rt_rw, dusun_jalan, desa_kelurahan, kecamatan, kota_kabupaten, provinsi, kode_pos

### Pembiayaan & Bantuan (7 fields):
- yang_membiayai, kebutuhan_khusus, kebutuhan_disabilitas, no_kip, no_kk, nama_kepala_keluarga, no_kks_kps

### Data Ayah (8 fields):
- nama_ayah, nik_ayah, tempat_tanggal_lahir_ayah, status_ayah, pendidikan_ayah, pekerjaan_ayah, penghasilan_ayah, no_telp_ayah

### Data Ibu (8 fields):
- nama_ibu, nik_ibu, tempat_tanggal_lahir_ibu, status_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu, no_telp_ibu

### Data Wali (9 fields):
- nama_wali, nik_wali, tempat_tanggal_lahir_wali, status_wali, pendidikan_wali, pekerjaan_wali, penghasilan_wali, no_telp_wali, hubungan_wali

### Status & Berkas (5 fields):
- status_santri, tanggal_nonaktif, alasan_nonaktif, foto_santri, berkas_pendukung, pindah_ke, tahun_pindah, tanggal_boyong

## 🚀 Deployment:

```bash
npm run build
npx wrangler pages deploy .vercel/output/static
```

## ✨ Hasil Akhir:

Setelah semua langkah selesai:
- ✅ Form input santri akan memiliki 7 tab terorganisir
- ✅ Semua 76 field database dapat diisi
- ✅ Upload foto via Cloudinary berfungsi
- ✅ Data tersimpan lengkap di database remote
- ✅ Tidak ada lagi error DB_RUNTIME_ERROR

## 📝 Catatan Penting:

1. **Field yang Wajib Diisi**:
   - nama_siswa (Nama Lengkap)
   - kelas (Kelas/Jenjang)
   - kamar (Kamar)

2. **Field yang Auto-fill**:
   - madrasah (otomatis dari kelas)
   - created_at (otomatis dari database)

3. **Field Opsional**:
   - Semua field lainnya bersifat opsional
   - Data Wali hanya diisi jika ada wali selain orang tua

4. **Format Data**:
   - Tanggal: YYYY-MM-DD
   - Tempat, Tanggal Lahir: "Kediri, 01 Januari 2010"
   - RT/RW: "001/002"
   - No. Telp: "08xxxxxxxxxx"
