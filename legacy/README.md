# Dashboard Admin SIM-PPDS - Cloudflare Pages

Sistem Informasi Manajemen Pondok Pesantren Darussalam (SIM-PPDS) versi 4.0.
Proyek ini telah dimigrasi dari Firebase/Netlify ke **Cloudflare Pages** untuk performa maksimal di Edge.

## 🚀 Fitur Baru (v4.0.0)
- ✅ **Edge Performance**: Backend berjalan di Cloudflare Workers (Edge Runtime).
- ✅ **Unified Structure**: Frontend (`public`) dan Backend (`functions`) berada dalam satu repository.
- ✅ **Serverless Database**: Menggunakan Driver Serverless Neon untuk koneksi database yang cepat.
- ✅ **Easy Deployment**: Cukup `git push` atau `wrangler pages deploy`.

## 📦 Struktur Project
```
Dashbord Admin/
├── public/                 # Frontend Static Assets
│   ├── index.html
│   ├── app.js
│   └── js/ core, modules, dsb.
├── functions/              # Backend API (Cloudflare Pages Functions)
│   └── api/
│       └── [[path]].js     # Catch-all API Handler
├── wrangler.toml           # Konfigurasi Cloudflare
├── package.json            # Unified Dependencies & Scripts
└── .env                    # Environment Variables (Local)
```

## 🛠️ Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
Gunakan Wrangler (Cloudflare CLI) untuk menjalankan frontend dan backend secara bersamaan:
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:8788`.

### 3. Setup Environment Variables
Tambahkan variabel berikut di dashboard Cloudflare Pages (Settings > Functions > Variables) atau di file `.env` untuk kembangan lokal:
- `DATABASE_URL`: Neon PostgreSQL connection string.
- `CLOUDINARY_CLOUD_NAME`: Nama cloud Cloudinary.
- `CLOUDINARY_API_KEY`: API Key Cloudinary.
- `CLOUDINARY_API_SECRET`: API Secret Cloudinary.

## 🚀 Deployment

### Manual Deploy (via CLI)
```bash
npm run deploy
```

### Automated Deploy (CI/CD)
Hubungkan repository GitHub Anda ke Cloudflare Pages di Dashboard Cloudflare. Build command: `npm install`, Output directory: `public`.

## 📊 Monitoring
Log backend dapat dilihat di Dashboard Cloudflare: **Workers & Pages > sim-ppds-cloudflare > Functions > Logs**.

---
**Version**: 4.0.0 (Cloudflare Migration)
**Database**: Neon PostgreSQL (Serverless Mode)
**Runtime**: Cloudflare Pages Functions
