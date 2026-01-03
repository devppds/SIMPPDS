# 🔧 Perbaikan Client-Side Exceptions - Dokumentasi Lengkap

## 📋 Ringkasan Masalah

Banyak halaman mengalami error: **"Application error: a client-side exception has occurred"**

### Penyebab Utama:
1. **useEffect Dependencies Tidak Konsisten** - Menyebabkan infinite loops
2. **Hooks Dipanggil Tidak di Top Level** - Melanggar Rules of Hooks
3. **Akses Data Sebelum Mounted** - Race conditions
4. **Missing Safety Checks** - Undefined/null access errors

---

## ✅ Perbaikan Yang Telah Dilakukan

### 1. **Halaman Absensi Pengurus** (`src/app/sekretariat/absen-pengurus/page.js`)

#### Masalah:
```javascript
// ❌ SALAH - useEffect dengan syntax error dan logic yang salah
useEffect(() => {
    if (!mounted) {
        setMounted(true);
        if (mounted && filterMonth && filterYear) {  // ❌ Tidak akan pernah true!
            loadData();
        }
        return () => { isMounted.current = false; };
    }, [mounted, filterMonth, filterYear, loadData]);  // ❌ Kurung salah tempat
```

#### Solusi:
```javascript
// ✅ BENAR - Pisahkan menjadi 2 useEffect yang jelas
useEffect(() => {
    if (!mounted) {
        const nowHijri = moment();
        const currentHijriMonthIdx = nowHijri.iMonth();
        const currentHijriYear = nowHijri.iYear();
        setFilterMonth(MONTHS[currentHijriMonthIdx]);
        setFilterYear(currentHijriYear.toString());
        setMounted(true);
    }
}, [mounted]);

useEffect(() => {
    if (mounted && filterMonth && filterYear) {
        isMounted.current = true;
        loadData();
        return () => { isMounted.current = false; };
    }
}, [mounted, filterMonth, filterYear, loadData]);
```

### 2. **Halaman Kalender & Laporan** 

#### Masalah:
```javascript
// ❌ SALAH - Hook dipanggil di dalam JSX
<img src={useAuth().config?.logo_url || "default.png"} />
```

#### Solusi:
```javascript
// ✅ BENAR - Hook dipanggil di top level
export default function KalenderPage() {
    const { config } = useAuth();  // ✅ Di top level
    
    return <img src={config?.logo_url || "default.png"} />;
}
```

### 3. **Halaman Riwayat Absensi**

#### Masalah:
```javascript
// ❌ SALAH - Stats calculation menggunakan field yang salah
const totalIzin = displayData.reduce((sum, d) => sum + d.hadir, 0);  // ❌ Harusnya d.izin
const totalAlfa = displayData.reduce((sum, d) => sum + d.hadir, 0);  // ❌ Harusnya d.alfa
```

#### Solusi:
```javascript
// ✅ BENAR - Menggunakan field yang tepat
const totalHadir = displayData.reduce((sum, d) => sum + (Number(d.hadir) || 0), 0);
const totalIzin = displayData.reduce((sum, d) => sum + (Number(d.izin) || 0), 0);
const totalAlfa = displayData.reduce((sum, d) => sum + (Number(d.alfa) || 0), 0);
```

---

## 📚 Pola Standar untuk Mencegah Error

### Pattern 1: Mounted Check
```javascript
export default function MyPage() {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    if (!mounted) {
        return <LoadingSpinner />;
    }
    
    return <div>Content</div>;
}
```

### Pattern 2: Safe Data Access
```javascript
// ✅ Gunakan optional chaining dan default values
const userName = user?.fullname || 'Guest';
const logoUrl = config?.logo_url || 'default.png';
const itemCount = data?.length || 0;

// ✅ Safe array operations
const safeArray = Array.isArray(data) ? data : [];
safeArray.map(item => ...)
```

### Pattern 3: Consistent Hook Calls
```javascript
export default function MyPage() {
    // ✅ SEMUA hooks di top level, sebelum any conditional
    const { user, config } = useAuth();
    const { canEdit } = usePagePermission();
    const [data, setData] = useState([]);
    
    // ❌ JANGAN panggil hooks di dalam if/loop/nested functions
    // if (someCondition) {
    //     const { user } = useAuth(); // WRONG!
    // }
    
    return <div>Content</div>;
}
```

### Pattern 4: Separate useEffect for Different Concerns
```javascript
// ✅ BENAR - Pisahkan initialization dan data loading
useEffect(() => {
    // Initialize state yang butuh client-side calculation
    setMounted(true);
    setCurrentDate(new Date().toISOString());
}, []);

useEffect(() => {
    // Load data hanya setelah mounted
    if (mounted) {
        loadData();
    }
}, [mounted]);
```

### Pattern 5: Safe useEffect Dependencies
```javascript
// ✅ BENAR - Include semua dependencies
useEffect(() => {
    if (mounted && filterMonth && filterYear) {
        loadData();
    }
}, [mounted, filterMonth, filterYear, loadData]);

// ✅ Atau gunakan useCallback untuk stable function reference
const loadData = useCallback(async () => {
    // ...
}, [/* dependencies */]);
```

---

## 🎯 Checklist untuk Halaman Baru

Saat membuat halaman baru, pastikan:

- [ ] ✅ Semua hooks dipanggil di top level
- [ ] ✅ Ada mounted state check
- [ ] ✅ Gunakan optional chaining (`?.`) untuk object access
- [ ] ✅ Gunakan default values (`|| 'default'`)
- [ ] ✅ Pisahkan useEffect berdasarkan concern
- [ ] ✅ Include semua dependencies di useEffect
- [ ] ✅ Tambahkan loading state
- [ ] ✅ Handle error cases dengan try-catch

---

## 🔍 Cara Debug Client-Side Exceptions

1. **Buka Browser Console** (F12)
2. **Lihat Error Stack Trace** - Akan menunjukkan file dan line number
3. **Cek Common Issues:**
   - Hooks dipanggil conditional?
   - Ada akses ke undefined object?
   - useEffect dependencies lengkap?
   - Ada infinite loop?

4. **Test dengan:**
   ```javascript
   console.log('Mounted:', mounted);
   console.log('Data:', data);
   console.log('User:', user);
   ```

---

## 📊 Status Perbaikan

| Halaman | Status | Prioritas | Catatan |
|---------|--------|-----------|---------|
| Absensi Pengurus | ✅ Fixed | High | useEffect syntax error |
| Kalender | ✅ Fixed | High | Hook in JSX |
| Laporan | ✅ Fixed | High | Hook in JSX |
| Riwayat Absensi | ✅ Fixed | Medium | Stats calculation |
| Ustadz | ✅ OK | - | Sudah ada mounted check |
| Pengurus | ✅ OK | - | Sudah ada mounted check |
| Santri | ⚠️ Review | Medium | Perlu dicek |
| Kamar | ⚠️ Review | Low | Perlu dicek |

---

## 🚀 Next Steps

1. **Test semua halaman** yang sudah diperbaiki
2. **Review halaman lain** yang belum dicek
3. **Tambahkan error boundaries** untuk catch unexpected errors
4. **Setup error logging** untuk production monitoring

---

## 📝 Commit History

- `248c1a8` - fix: resolve client-side exceptions with proper useEffect patterns and mounted checks
- `7e36f24` - fix: resolve client-side exception by moving hooks to top level of components
- `0195213` - fix: implement dynamic branding and resolve Cloudinary 404 issues

---

**Dibuat:** 2026-01-03  
**Terakhir Update:** 2026-01-03  
**Developer:** DevElz Team
