---
description: Deploy aplikasi ke Firebase Hosting
---

# Workflow: Deploy ke Firebase Hosting

## Prerequisites
1. Pastikan sudah install Firebase CLI: `npm install -g firebase-tools`
2. Login ke Firebase: `firebase login`

## Langkah Deployment

### 1. Install Dependencies
```bash
# Install dependencies untuk Cloud Functions
cd functions
npm install
cd ..
```

### 2. Setup Environment Variables di Firebase
```bash
# Set environment variables untuk Cloud Functions
firebase functions:config:set database.url="postgresql://neondb_owner:npg_C8UG9lLAnoWx@ep-noisy-meadow-a1zm9l52-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

firebase functions:config:set email.user="sekretarisppds@gmail.com"
firebase functions:config:set email.pass="tioj yquf fawm wfjs"

firebase functions:config:set cloudinary.cloud_name="dceamfy3n"
firebase functions:config:set cloudinary.api_key="257842458234963"
firebase functions:config:set cloudinary.api_secret="4tpgYL-MxG30IhFH4qkT8KFYzwI"
```

**ATAU** gunakan file .env (lebih mudah untuk development):
```bash
# File functions/.env sudah dibuat otomatis
# Untuk production, gunakan Firebase Secrets (lebih aman)
```

### 3. Test Locally (Optional)
// turbo
```bash
# Test functions secara lokal
firebase emulators:start
```

### 4. Deploy ke Firebase
// turbo
```bash
# Deploy hosting dan functions sekaligus
firebase deploy
```

**ATAU** deploy terpisah:
```bash
# Deploy hosting saja
firebase deploy --only hosting

# Deploy functions saja
firebase deploy --only functions
```

### 5. Verifikasi Deployment
Setelah deploy, aplikasi akan tersedia di:
- **Hosting URL**: https://sim-ppds.web.app atau https://sim-ppds.firebaseapp.com
- **API Endpoint**: https://us-central1-sim-ppds.cloudfunctions.net/api

### 6. Update Frontend API URL (Jika Perlu)
Jika API endpoint berubah, update di file JavaScript yang memanggil API.

## Troubleshooting

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Not logged in"
```bash
firebase login
```

### Error: "Billing account required for Cloud Functions"
- Firebase Cloud Functions memerlukan Blaze Plan (pay-as-you-go)
- Free tier tetap generous: 2M invocations/month, 400K GB-sec, 200K CPU-sec
- Untuk development, gunakan emulator: `firebase emulators:start`

### Error: Environment variables tidak terbaca
```bash
# Cek config
firebase functions:config:get

# Set ulang jika perlu
firebase functions:config:set key="value"
```

## Monitoring & Logs

```bash
# Lihat logs functions
firebase functions:log

# Lihat logs real-time
firebase functions:log --only api
```

## Custom Domain (Optional)

1. Buka Firebase Console: https://console.firebase.google.com
2. Pilih project "sim-ppds"
3. Hosting → Add custom domain
4. Ikuti instruksi untuk setup DNS

## Rollback (Jika Ada Masalah)

```bash
# Lihat deployment history
firebase hosting:channel:list

# Rollback ke versi sebelumnya via Firebase Console
```
