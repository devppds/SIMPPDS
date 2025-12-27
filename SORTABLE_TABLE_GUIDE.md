# Panduan Implementasi SortableTable

## Komponen Sudah Tersedia
File: `src/components/SortableTable.js`

## Cara Menggunakan

### 1. Import Komponen
```javascript
import SortableTable from '@/components/SortableTable';
```

### 2. Definisikan Struktur Kolom
```javascript
const columns = [
    {
        key: 'nama_siswa',           // Key dari data object
        label: 'Nama Santri',        // Label yang ditampilkan di header
        sortable: true,              // Optional, default true
        width: '200px',              // Optional, lebar kolom
        align: 'left',               // Optional: 'left', 'center', 'right'
        render: (row) => (           // Optional: custom render
            <div style={{ fontWeight: 700 }}>
                {row.nama_siswa}
            </div>
        )
    },
    {
        key: 'kamar',
        label: 'Kamar',
        render: (row) => (
            <span className="th-badge">
                {row.kamar}
            </span>
        )
    },
    {
        key: 'status_santri',
        label: 'Status'
    },
    {
        key: 'actions',
        label: 'Aksi',
        sortable: false,  // Kolom aksi tidak perlu sorting
        width: '150px',
        render: (row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(row)}>
                    <i className="fas fa-edit"></i>
                </button>
                <button onClick={() => handleDelete(row.id)}>
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        )
    }
];
```

### 3. Gunakan Komponen
```javascript
<SortableTable 
    columns={columns}
    data={filteredData}
    loading={loading}
    emptyMessage="Tidak ada data santri."
    onRowClick={(row) => handleRowClick(row)}  // Optional
/>
```

## Contoh Implementasi Lengkap

### Data Santri
```javascript
const columns = [
    {
        key: 'foto_santri',
        label: 'Foto',
        sortable: false,
        width: '80px',
        render: (row) => (
            <img 
                src={row.foto_santri || '/default-avatar.png'} 
                alt={row.nama_siswa}
                style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
        )
    },
    {
        key: 'nama_siswa',
        label: 'Nama Santri',
        render: (row) => (
            <div>
                <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {row.stambuk_pondok}
                </div>
            </div>
        )
    },
    {
        key: 'kamar',
        label: 'Kamar',
        render: (row) => (
            <span className="th-badge" style={{ background: 'var(--primary-light)' }}>
                {row.kamar}
            </span>
        )
    },
    {
        key: 'status_santri',
        label: 'Status',
        render: (row) => (
            <span className="th-badge" style={{
                background: row.status_santri === 'Aktif' ? '#dcfce7' : '#fee2e2',
                color: row.status_santri === 'Aktif' ? '#166534' : '#991b1b'
            }}>
                {row.status_santri}
            </span>
        )
    },
    {
        key: 'actions',
        label: 'Aksi',
        sortable: false,
        width: '150px',
        render: (row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-vibrant btn-vibrant-purple" onClick={() => openDetail(row)}>
                    <i className="fas fa-eye"></i>
                </button>
                <button className="btn-vibrant btn-vibrant-blue" onClick={() => openEdit(row)}>
                    <i className="fas fa-edit"></i>
                </button>
                {isAdmin && (
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)}>
                        <i className="fas fa-trash"></i>
                    </button>
                )}
            </div>
        )
    }
];
```

### Arus Kas
```javascript
const columns = [
    { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
    {
        key: 'tipe',
        label: 'Jenis',
        render: (row) => (
            <span className="th-badge" style={{
                background: row.tipe === 'Masuk' ? '#dcfce7' : '#fee2e2',
                color: row.tipe === 'Masuk' ? '#166534' : '#991b1b'
            }}>
                {row.tipe.toUpperCase()}
            </span>
        )
    },
    { key: 'kategori', label: 'Kategori' },
    {
        key: 'nominal',
        label: 'Nominal',
        render: (row) => (
            <span style={{ 
                fontWeight: 800, 
                color: row.tipe === 'Masuk' ? '#059669' : '#dc2626' 
            }}>
                {row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
            </span>
        )
    },
    { key: 'pj', label: 'PJ' },
    {
        key: 'actions',
        label: 'Aksi',
        sortable: false,
        width: '150px',
        render: (row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)}>
                    <i className="fas fa-eye"></i>
                </button>
                <button className="btn-vibrant btn-vibrant-blue" onClick={() => openEdit(row)}>
                    <i className="fas fa-edit"></i>
                </button>
                {isAdmin && (
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)}>
                        <i className="fas fa-trash"></i>
                    </button>
                )}
            </div>
        )
    }
];
```

### Pelanggaran
```javascript
const columns = [
    { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
    {
        key: 'nama_santri',
        label: 'Nama Santri',
        render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span>
    },
    { key: 'jenis_pelanggaran', label: 'Jenis Pelanggaran' },
    {
        key: 'poin',
        label: 'Poin',
        render: (row) => (
            <span style={{ 
                fontWeight: 800, 
                color: row.poin >= 50 ? '#dc2626' : row.poin >= 20 ? '#f59e0b' : '#059669' 
            }}>
                {row.poin}
            </span>
        )
    },
    { key: 'takzir', label: 'Takzir' },
    { key: 'petugas', label: 'Petugas' },
    {
        key: 'actions',
        label: 'Aksi',
        sortable: false,
        width: '150px',
        render: (row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-vibrant btn-vibrant-blue" onClick={() => openEdit(row)}>
                    <i className="fas fa-edit"></i>
                </button>
                {isAdmin && (
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)}>
                        <i className="fas fa-trash"></i>
                    </button>
                )}
            </div>
        )
    }
];
```

## Fitur Yang Tersedia

1. **Auto Sorting**: Klik header untuk sort ascending/descending
2. **Smart Type Detection**: Otomatis detect number vs string
3. **Custom Render**: Bisa custom tampilan per kolom
4. **Disable Sort**: Kolom tertentu bisa di-disable sortingnya
5. **Loading State**: Built-in loading indicator
6. **Empty State**: Custom empty message
7. **Row Click Handler**: Optional onClick untuk setiap row

## Tips Implementasi

1. Untuk kolom dengan custom render yang kompleks (foto, badge, dll), tetap bisa di-sort berdasarkan value aslinya
2. Kolom "Aksi" sebaiknya set `sortable: false`
3. Gunakan `width` untuk kolom yang perlu ukuran tetap (foto, aksi, dll)
4. Data yang di-pass ke `data` prop akan otomatis di-sort, jadi tidak perlu manual sorting lagi

## Halaman Yang Sudah Menggunakan
- ✅ Atur Layanan (Bendahara)

## Halaman Yang Siap Di-Upgrade
- 📋 Data Santri
- 📋 Arus Kas
- 📋 Pelanggaran
- 📋 Izin
- 📋 Data Ustadz
- 📋 Data Pengurus
- 📋 Barang Sitaan
- 📋 Registrasi Barang
- 📋 Kesehatan
- 📋 Pendidikan
- 📋 Layanan Unit (Semua)

Tinggal copy struktur kolom dari dokumentasi ini dan sesuaikan dengan kebutuhan halaman!
