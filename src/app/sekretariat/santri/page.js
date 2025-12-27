'use client';
import React, { useState, useEffect } from 'react';
import { apiCall, formatDate, exportToCSV, exportToExcel } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function SantriPage() {
    const { isAdmin } = useAuth();
    const [santri, setSantri] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Aktif');
    const [filterMadrasah, setFilterMadrasah] = useState('Semua'); // Filter Madrasah (MHM/MIU)
    const [activeTab, setActiveTab] = useState('umum'); // For Modal Tabs
    const [listKelas, setListKelas] = useState([]); // Master Data Kelas
    const [listKamar, setListKamar] = useState([]); // Master Data Kamar

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [isMutasiOpen, setIsMutasiOpen] = useState(false);
    const [mutasiData, setMutasiData] = useState(null);
    const [mutasiForm, setMutasiForm] = useState({ status_santri: 'Boyong', pindah_ke: '', tahun_pindah: '', tanggal_boyong: new Date().toISOString().split('T')[0] });
    const [formData, setFormData] = useState({
        // Identitas Pondok
        stambuk_pondok: '', stambuk_madrasah: '', nama_siswa: '', tahun_masuk: '', kamar: '', status_mb: 'Baru', madrasah: '', kelas: '',
        // Identitas Pribadi
        nik: '', nisn: '', tempat_tanggal_lahir: '', jenis_kelamin: 'Laki-laki', agama: 'Islam', kewarganegaraan: 'WNI',
        anak_ke: '', jumlah_saudara_kandung: '', jumlah_saudara_tiri: '', jumlah_saudara_angkat: '', status_anak: '',
        // Alamat
        alamat: '', dusun_jalan: '', desa_kelurahan: '', kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '',
        // Minat & Bakat
        hobi: '', cita_cita: '',
        // Pendidikan Sebelumnya
        asal_sekolah: '', npsn: '', alamat_sekolah: '', no_ijazah_skhun: '', no_peserta_ujian: '', tahun_lulus: '',
        // Pembiayaan & Bantuan
        yang_membiayai: 'Orang Tua', kebutuhan_khusus: '', kebutuhan_disabilitas: '', no_kip: '', no_kk: '', nama_kepala_keluarga: '', no_kks_kps: '',
        // Data Ayah
        nama_ayah: '', nik_ayah: '', tempat_tanggal_lahir_ayah: '', status_ayah: 'Hidup', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_telp_ayah: '',
        // Data Ibu
        nama_ibu: '', nik_ibu: '', tempat_tanggal_lahir_ibu: '', status_ibu: 'Hidup', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_telp_ibu: '',
        // Data Wali (Opsional)
        nama_wali: '', nik_wali: '', tempat_tanggal_lahir_wali: '', status_wali: '', pendidikan_wali: '', pekerjaan_wali: '', penghasilan_wali: '', no_telp_wali: '', hubungan_wali: '',
        // Status & Berkas
        status_santri: 'Aktif', tanggal_nonaktif: '', alasan_nonaktif: '', foto_santri: '', berkas_pendukung: '',
        pindah_ke: '', tahun_pindah: '', tanggal_boyong: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
        loadMasterData();
    }, [filterStatus]);

    const loadMasterData = async () => {
        try {
            const [resKelas, resKamar] = await Promise.all([
                apiCall('getData', 'GET', { type: 'master_kelas' }),
                apiCall('getData', 'GET', { type: 'kamar' })
            ]);
            setListKelas((resKelas || []).sort((a, b) => a.urutan - b.urutan));
            const formattedRooms = (resKamar || []).map(r => {
                const num = r.nama_kamar.toString().padStart(2, '0');
                const label = `${r.asrama} ${num}`;
                return { id: r.id, label, value: label };
            }).sort((a, b) => a.label.localeCompare(b.label));
            setListKamar(formattedRooms);
        } catch (e) { console.error(e); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = { timestamp };
            const { signature, apiKey, cloudName } = await apiCall('getCloudinarySignature', 'POST', { data: { paramsToSign } });
            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
            const result = await res.json();
            if (result.secure_url) {
                setFormData(prev => ({ ...prev, foto_santri: result.secure_url }));
                alert('Berhasil mengunggah foto!');
            } else {
                throw new Error(result.error?.message || 'Gagal upload Cloudinary');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengunggah ke Cloudinary. Pastikan konfigurasi sudah benar.');
        } finally { setUploading(false); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await apiCall('getData', 'GET', { type: 'santri' });
            let filtered = data || [];
            if (filterStatus === 'Aktif') {
                filtered = filtered.filter(s => !s.status_santri || s.status_santri === 'Aktif');
            } else {
                filtered = filtered.filter(s => s.status_santri === filterStatus);
            }
            setSantri(filtered);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        const headers = ["Foto Santri", "Stambuk Pondok", "Stambuk Madrasah", "Tahun Masuk", "Kamar", "Status MB", "Madrasah", "Kelas", "NIK", "Nama Siswa", "NISN", "Tempat Tanggal Lahir", "Jenis Kelamin", "Agama", "Hobi", "Cita Cita", "Kewarganegaraan", "No KK", "NIK Ayah", "Nama Ayah", "Pekerjaan Ayah", "Pendidikan Ayah", "No Telp Ayah", "Penghasilan Ayah", "NIK Ibu", "Nama Ibu", "Pekerjaan Ibu", "Pendidikan Ibu", "No Telp Ibu", "Dusun Jalan", "RT RW", "Desa Kelurahan", "Kecamatan", "Kota Kabupaten", "Provinsi", "Kode Pos", "Status Santri", "Pindah Ke", "Tahun Pindah", "Tanggal Boyong"];
        exportToExcel(santri, 'Data_Santri_Lengkap', headers);
    };

    const handleDownloadTemplate = () => {
        const headers = ["foto_santri", "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb", "madrasah", "kelas", "nik", "nama_siswa", "nisn", "tempat_tanggal_lahir", "jenis_kelamin", "agama", "hobi", "cita_cita", "kewarganegaraan", "no_kk", "nik_ayah", "nama_ayah", "pekerjaan_ayah", "pendidikan_ayah", "no_telp_ayah", "penghasilan_ayah", "nik_ibu", "nama_ibu", "pekerjaan_ibu", "pendidikan_ibu", "no_telp_ibu", "dusun_jalan", "rt_rw", "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos", "status_santri", "pindah_ke", "tahun_pindah", "tanggal_boyong"];
        exportToCSV([], 'Template_Manual_Santri', headers);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) return;
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            setSubmitting(true);
            let successCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const obj = {};
                headers.forEach((header, index) => { obj[header] = values[index]; });
                try { await apiCall('saveData', 'POST', { type: 'santri', data: obj }); successCount++; } catch (err) { console.error(err); }
            }
            setSubmitting(false);
            alert(`Selesai! ${successCount} santri berhasil diimpor.`);
            loadData();
        };
        reader.readAsText(file);
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else {
            setEditId(null);
            setFormData({
                // Identitas Pondok
                stambuk_pondok: '', stambuk_madrasah: '', nama_siswa: '', tahun_masuk: '', kamar: '', status_mb: 'Baru', madrasah: '', kelas: '',
                // Identitas Pribadi
                nik: '', nisn: '', tempat_tanggal_lahir: '', jenis_kelamin: 'Laki-laki', agama: 'Islam', kewarganegaraan: 'WNI',
                anak_ke: '', jumlah_saudara_kandung: '', jumlah_saudara_tiri: '', jumlah_saudara_angkat: '', status_anak: '',
                // Alamat
                alamat: '', dusun_jalan: '', desa_kelurahan: '', kecamatan: '', kota_kabupaten: '', provinsi: '', kode_pos: '',
                // Minat & Bakat
                hobi: '', cita_cita: '',
                // Pendidikan Sebelumnya
                asal_sekolah: '', npsn: '', alamat_sekolah: '', no_ijazah_skhun: '', no_peserta_ujian: '', tahun_lulus: '',
                // Pembiayaan & Bantuan
                yang_membiayai: 'Orang Tua', kebutuhan_khusus: '', kebutuhan_disabilitas: '', no_kip: '', no_kk: '', nama_kepala_keluarga: '', no_kks_kps: '',
                // Data Ayah
                nama_ayah: '', nik_ayah: '', tempat_tanggal_lahir_ayah: '', status_ayah: 'Hidup', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_telp_ayah: '',
                // Data Ibu
                nama_ibu: '', nik_ibu: '', tempat_tanggal_lahir_ibu: '', status_ibu: 'Hidup', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_telp_ibu: '',
                // Data Wali (Opsional)
                nama_wali: '', nik_wali: '', tempat_tanggal_lahir_wali: '', status_wali: '', pendidikan_wali: '', pekerjaan_wali: '', penghasilan_wali: '', no_telp_wali: '', hubungan_wali: '',
                // Status & Berkas
                status_santri: 'Aktif', tanggal_nonaktif: '', alasan_nonaktif: '', foto_santri: '', berkas_pendukung: '',
                pindah_ke: '', tahun_pindah: '', tanggal_boyong: ''
            });
        }
        setActiveTab('umum');
        setIsModalOpen(true);
    };

    const openDetail = (item) => { setDetailData(item); setIsDetailOpen(true); };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'santri', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            alert(editId ? 'Perubahan berhasil disimpan!' : 'Data santri berhasil ditambahkan!');
        } catch (err) { alert('Gagal: ' + err.message); }
        finally { setSubmitting(false); }
    };

    const deleteSantri = async (id) => {
        if (!confirm('Hapus data santri ini secara permanen?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'santri', id }); loadData(); } catch (err) { alert(err.message); }
    };

    const openMutasi = (santri) => {
        setMutasiData(santri);
        setMutasiForm({ status_santri: 'Boyong', pindah_ke: '', tahun_pindah: new Date().getFullYear().toString(), tanggal_boyong: new Date().toISOString().split('T')[0] });
        setIsMutasiOpen(true);
    };

    const handleMutasi = async () => {
        if (!mutasiData) return;
        if (!confirm(`Yakin mengubah status ${mutasiData.nama_siswa} menjadi ${mutasiForm.status_santri}?`)) return;
        try {
            const updatedData = {
                ...mutasiData,
                status_santri: mutasiForm.status_santri,
                pindah_ke: mutasiForm.status_santri === 'Pindah' ? mutasiForm.pindah_ke : '',
                tahun_pindah: (mutasiForm.status_santri === 'Pindah' || mutasiForm.status_santri === 'Lulus') ? mutasiForm.tahun_pindah : '',
                tanggal_boyong: mutasiForm.status_santri === 'Boyong' ? mutasiForm.tanggal_boyong : ''
            };
            await apiCall('saveData', 'POST', { type: 'santri', data: updatedData });
            setIsMutasiOpen(false);
            loadData();
            alert(`Status ${mutasiData.nama_siswa} berhasil diubah menjadi ${mutasiForm.status_santri}!`);
        } catch (err) { alert('Gagal: ' + err.message); }
    };

    const displayData = santri.filter(s => {
        const matchSearch = (s.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.nik || '').toLowerCase().includes(search.toLowerCase());
        const mdr = (s.madrasah || '').toUpperCase();
        const kls = (s.kelas || '').toUpperCase();
        let matchMadrasah = filterMadrasah === 'Semua';
        if (filterMadrasah === 'MHM') {
            matchMadrasah = mdr === 'MHM' || kls.includes('IBTIDA') || kls.includes('TSANAWI') || kls.includes('ALIYYAH') || kls.includes("MA'HAD ALY");
        } else if (filterMadrasah === 'MIU') {
            matchMadrasah = mdr === 'MIU' || kls.includes('ULA') || kls.includes('WUSTHO') || kls.includes('ULYA') || mdr.includes('IDADIYYAH');
        }
        return matchSearch && matchMadrasah;
    });

    const columns = [
        {
            key: 'foto_santri',
            label: 'Foto',
            sortable: false,
            width: '80px',
            render: (row) => (
                <img src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} alt={row.nama_siswa} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
            )
        },
        {
            key: 'nama_siswa',
            label: 'Nama Santri',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.stambuk_pondok}</div>
                </div>
            )
        },
        {
            key: 'kamar',
            label: 'Kamar',
            render: (row) => (<span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.kamar}</span>)
        },
        {
            key: 'kelas',
            label: 'Pendidikan',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{row.kelas}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.madrasah}</div>
                </div>
            )
        },
        {
            key: 'status_santri',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{ background: row.status_santri === 'Aktif' ? '#dcfce7' : '#fee2e2', color: row.status_santri === 'Aktif' ? '#166534' : '#991b1b' }}>{row.status_santri}</span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openDetail(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {row.status_santri === 'Aktif' && <button className="btn-vibrant btn-vibrant-orange" onClick={() => openMutasi(row)} title="Mutasi Status" style={{ background: '#f59e0b', color: 'white' }}><i className="fas fa-exchange-alt"></i></button>}
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteSantri(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            {/* Professional Print Header */}
            <div className="print-header-corporate">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png" style={{ width: '80px' }} alt="Logo" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 900 }}>PONDOK PESANTREN DARUSSALAM LIRBOYO</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Sistem Informasi Manajemen Terpadu (SIM-PPDS)</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Lirboyo, Kota Kediri, Jawa Timur</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Daftar Santri {filterStatus === 'Aktif' ? 'Aktif' : filterStatus}</h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Per Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Database Santri {filterStatus === 'Aktif' ? 'Aktif' : filterStatus}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total {displayData.length} santri ditemukan.</p>
                    </div>
                    <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()} title="Cetak Daftar"><i className="fas fa-print"></i></button>
                        <button className="btn btn-outline btn-sm" onClick={handleDownloadTemplate}>Template</button>
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                            Import <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                        <button className="btn btn-outline btn-sm" onClick={handleExport}>Export</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Baru</button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama, stambuk, atau NIK..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="form-control" style={{ width: '180px', fontWeight: 700 }} value={filterMadrasah} onChange={(e) => setFilterMadrasah(e.target.value)}>
                        <option value="Semua">Unit: Semua</option>
                        <option value="MHM">MHM</option>
                        <option value="MIU">MIU</option>
                    </select>
                    <select className="form-control" style={{ width: '220px', fontWeight: 700 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="Aktif">Status: Aktif</option>
                        <option value="Boyong">Boyong</option>
                        <option value="Pindah">Pindah</option>
                        <option value="Lulus">Lulus</option>
                    </select>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Tidak ada data santri." />
            </div>

            {/* Modal Input/Edit */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Pembaruan Data Santri" : "Pendaftaran Santri Baru"} footer={(<>
                <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batalkan</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Memproses...' : 'Simpan Data'}</button>
            </>)}>
                <div className="modal-tabs">
                    <button type="button" className={`tab-btn ${activeTab === 'umum' ? 'active' : ''}`} onClick={() => setActiveTab('umum')}><i className="fas fa-id-card"></i> Identitas</button>
                    <button type="button" className={`tab-btn ${activeTab === 'pribadi' ? 'active' : ''}`} onClick={() => setActiveTab('pribadi')}><i className="fas fa-user"></i> Pribadi</button>
                    <button type="button" className={`tab-btn ${activeTab === 'pendidikan' ? 'active' : ''}`} onClick={() => setActiveTab('pendidikan')}><i className="fas fa-graduation-cap"></i> Pendidikan</button>
                    <button type="button" className={`tab-btn ${activeTab === 'wali' ? 'active' : ''}`} onClick={() => setActiveTab('wali')}><i className="fas fa-users"></i> Wali / Ortu</button>
                    <button type="button" className={`tab-btn ${activeTab === 'alamat' ? 'active' : ''}`} onClick={() => setActiveTab('alamat')}><i className="fas fa-map-marked-alt"></i> Alamat</button>
                    <button type="button" className={`tab-btn ${activeTab === 'bantuan' ? 'active' : ''}`} onClick={() => setActiveTab('bantuan')}><i className="fas fa-hand-holding-heart"></i> Bantuan</button>
                    <button type="button" className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}><i className="fas fa-file-alt"></i> Status</button>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                    {activeTab === 'umum' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Nama Lengkap *</label><input type="text" className="form-control" value={formData.nama_siswa} onChange={e => setFormData({ ...formData, nama_siswa: e.target.value })} required /></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Stambuk Pondok</label><input type="text" className="form-control" value={formData.stambuk_pondok} onChange={e => setFormData({ ...formData, stambuk_pondok: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Stambuk Madrasah</label><input type="text" className="form-control" value={formData.stambuk_madrasah} onChange={e => setFormData({ ...formData, stambuk_madrasah: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">NIK</label><input type="text" className="form-control" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">NISN</label><input type="text" className="form-control" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Kelas / Jenjang *</label>
                                    <select className="form-control" value={formData.kelas} onChange={e => {
                                        const selected = listKelas.find(k => k.nama_kelas === e.target.value);
                                        setFormData({ ...formData, kelas: e.target.value, madrasah: selected ? selected.lembaga : '' });
                                    }}>
                                        <option value="">- Pilih Kelas -</option>
                                        {listKelas.map(k => (<option key={k.id} value={k.nama_kelas}>{k.nama_kelas} ({k.lembaga})</option>))}
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Madrasah</label><input type="text" className="form-control" value={formData.madrasah} readOnly placeholder="Otomatis" /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Kamar *</label>
                                    <select className="form-control" value={formData.kamar} onChange={e => setFormData({ ...formData, kamar: e.target.value })}>
                                        <option value="">- Pilih Kamar -</option>
                                        {listKamar.map(r => (<option key={r.id} value={r.value}>{r.label}</option>))}
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Tahun Masuk</label><input type="text" className="form-control" value={formData.tahun_masuk} onChange={e => setFormData({ ...formData, tahun_masuk: e.target.value })} placeholder="2024" /></div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status MB</label>
                                <select className="form-control" value={formData.status_mb} onChange={e => setFormData({ ...formData, status_mb: e.target.value })}>
                                    <option value="Baru">Baru</option>
                                    <option value="Lama">Lama</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {activeTab === 'pribadi' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Tempat, Tanggal Lahir</label><input type="text" className="form-control" value={formData.tempat_tanggal_lahir} onChange={e => setFormData({ ...formData, tempat_tanggal_lahir: e.target.value })} placeholder="Kediri, 01 Januari 2010" /></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Jenis Kelamin</label><select className="form-control" value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })}>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select></div>
                                <div className="form-group"><label className="form-label">Agama</label><select className="form-control" value={formData.agama} onChange={e => setFormData({ ...formData, agama: e.target.value })}>
                                    <option value="Islam">Islam</option>
                                    <option value="Kristen">Kristen</option>
                                    <option value="Katolik">Katolik</option>
                                    <option value="Hindu">Hindu</option>
                                    <option value="Buddha">Buddha</option>
                                    <option value="Konghucu">Konghucu</option>
                                </select></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Kewarganegaraan</label><input type="text" className="form-control" value={formData.kewarganegaraan} onChange={e => setFormData({ ...formData, kewarganegaraan: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Anak Ke</label><input type="number" className="form-control" value={formData.anak_ke} onChange={e => setFormData({ ...formData, anak_ke: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Jumlah Saudara Kandung</label><input type="number" className="form-control" value={formData.jumlah_saudara_kandung} onChange={e => setFormData({ ...formData, jumlah_saudara_kandung: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Jumlah Saudara Tiri</label><input type="number" className="form-control" value={formData.jumlah_saudara_tiri} onChange={e => setFormData({ ...formData, jumlah_saudara_tiri: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Jumlah Saudara Angkat</label><input type="number" className="form-control" value={formData.jumlah_saudara_angkat} onChange={e => setFormData({ ...formData, jumlah_saudara_angkat: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Status Anak</label><input type="text" className="form-control" value={formData.status_anak} onChange={e => setFormData({ ...formData, status_anak: e.target.value })} placeholder="Kandung/Tiri/Angkat" /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Hobi</label><input type="text" className="form-control" value={formData.hobi} onChange={e => setFormData({ ...formData, hobi: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Cita-cita</label><input type="text" className="form-control" value={formData.cita_cita} onChange={e => setFormData({ ...formData, cita_cita: e.target.value })} /></div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'pendidikan' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Asal Sekolah</label><input type="text" className="form-control" value={formData.asal_sekolah} onChange={e => setFormData({ ...formData, asal_sekolah: e.target.value })} /></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">NPSN Sekolah</label><input type="text" className="form-control" value={formData.npsn} onChange={e => setFormData({ ...formData, npsn: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Tahun Lulus</label><input type="text" className="form-control" value={formData.tahun_lulus} onChange={e => setFormData({ ...formData, tahun_lulus: e.target.value })} placeholder="2024" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Alamat Sekolah</label><textarea className="form-control" value={formData.alamat_sekolah} onChange={e => setFormData({ ...formData, alamat_sekolah: e.target.value })} rows="2"></textarea></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">No. Ijazah / SKHUN</label><input type="text" className="form-control" value={formData.no_ijazah_skhun} onChange={e => setFormData({ ...formData, no_ijazah_skhun: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">No. Peserta Ujian</label><input type="text" className="form-control" value={formData.no_peserta_ujian} onChange={e => setFormData({ ...formData, no_peserta_ujian: e.target.value })} /></div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'wali' && (
                        <div className="tab-content animate-in">
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '15px' }}>Data Ayah</h4>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Nama Ayah</label><input type="text" className="form-control" value={formData.nama_ayah} onChange={e => setFormData({ ...formData, nama_ayah: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">NIK Ayah</label><input type="text" className="form-control" value={formData.nik_ayah} onChange={e => setFormData({ ...formData, nik_ayah: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Tempat, Tanggal Lahir Ayah</label><input type="text" className="form-control" value={formData.tempat_tanggal_lahir_ayah} onChange={e => setFormData({ ...formData, tempat_tanggal_lahir_ayah: e.target.value })} placeholder="Kediri, 01 Januari 1980" /></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Status Ayah</label><select className="form-control" value={formData.status_ayah} onChange={e => setFormData({ ...formData, status_ayah: e.target.value })}><option value="Hidup">Hidup</option><option value="Meninggal">Meninggal</option></select></div>
                                <div className="form-group"><label className="form-label">Pendidikan Ayah</label><input type="text" className="form-control" value={formData.pendidikan_ayah} onChange={e => setFormData({ ...formData, pendidikan_ayah: e.target.value })} placeholder="S1, SMA, dll" /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Pekerjaan Ayah</label><input type="text" className="form-control" value={formData.pekerjaan_ayah} onChange={e => setFormData({ ...formData, pekerjaan_ayah: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Penghasilan Ayah</label><input type="text" className="form-control" value={formData.penghasilan_ayah} onChange={e => setFormData({ ...formData, penghasilan_ayah: e.target.value })} placeholder="< 1 Juta, 1-3 Juta, dll" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">No. WhatsApp Ayah</label><input type="text" className="form-control" value={formData.no_telp_ayah} onChange={e => setFormData({ ...formData, no_telp_ayah: e.target.value })} placeholder="08xxxxxxxxxx" /></div>

                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '15px', marginTop: '2rem' }}>Data Ibu</h4>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Nama Ibu</label><input type="text" className="form-control" value={formData.nama_ibu} onChange={e => setFormData({ ...formData, nama_ibu: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">NIK Ibu</label><input type="text" className="form-control" value={formData.nik_ibu} onChange={e => setFormData({ ...formData, nik_ibu: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Tempat, Tanggal Lahir Ibu</label><input type="text" className="form-control" value={formData.tempat_tanggal_lahir_ibu} onChange={e => setFormData({ ...formData, tempat_tanggal_lahir_ibu: e.target.value })} placeholder="Kediri, 01 Januari 1985" /></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Status Ibu</label><select className="form-control" value={formData.status_ibu} onChange={e => setFormData({ ...formData, status_ibu: e.target.value })}><option value="Hidup">Hidup</option><option value="Meninggal">Meninggal</option></select></div>
                                <div className="form-group"><label className="form-label">Pendidikan Ibu</label><input type="text" className="form-control" value={formData.pendidikan_ibu} onChange={e => setFormData({ ...formData, pendidikan_ibu: e.target.value })} placeholder="S1, SMA, dll" /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Pekerjaan Ibu</label><input type="text" className="form-control" value={formData.pekerjaan_ibu} onChange={e => setFormData({ ...formData, pekerjaan_ibu: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Penghasilan Ibu</label><input type="text" className="form-control" value={formData.penghasilan_ibu} onChange={e => setFormData({ ...formData, penghasilan_ibu: e.target.value })} placeholder="< 1 Juta, 1-3 Juta, dll" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">No. WhatsApp Ibu</label><input type="text" className="form-control" value={formData.no_telp_ibu} onChange={e => setFormData({ ...formData, no_telp_ibu: e.target.value })} placeholder="08xxxxxxxxxx" /></div>

                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '15px', marginTop: '2rem' }}>Data Wali (Opsional)</h4>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Nama Wali</label><input type="text" className="form-control" value={formData.nama_wali} onChange={e => setFormData({ ...formData, nama_wali: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">NIK Wali</label><input type="text" className="form-control" value={formData.nik_wali} onChange={e => setFormData({ ...formData, nik_wali: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">Hubungan Wali</label><input type="text" className="form-control" value={formData.hubungan_wali} onChange={e => setFormData({ ...formData, hubungan_wali: e.target.value })} placeholder="Paman, Kakek, dll" /></div>
                                <div className="form-group"><label className="form-label">No. WhatsApp Wali</label><input type="text" className="form-control" value={formData.no_telp_wali} onChange={e => setFormData({ ...formData, no_telp_wali: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
                            </div>
                        </div>
                    )}
// Old static region logic removed – using dynamic fetch of full Indonesia data (see later in file).

                    // Update village list when district changes
                    useEffect(() => {
                      if (formData.kecamatan && formData.kota_kabupaten && formData.provinsi) {
                        const provObj = regions.find(r => r.province === formData.provinsi);
                        const cityObj = provObj?.cities.find(c => c.name === formData.kota_kabupaten);
                        const districtObj = cityObj?.districts.find(d => d.name === formData.kecamatan);
                    const villages = districtObj ? districtObj.villages : [];
                    setVillageList(villages);
                        // reset desa and kode pos
                        setFormData(prev => ({...prev, desa_kelurahan: '', kode_pos: '' }));
                      } else {
                        setVillageList([]);
                        setFormData(prev => ({...prev, desa_kelurahan: '', kode_pos: '' }));
                      }
                    }, [formData.kecamatan, formData.kota_kabupaten, formData.provinsi]);

                    {activeTab === 'alamat' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Alamat</label><textarea className="form-control" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} rows="2" placeholder="Jl. Contoh No. 123"></textarea></div>
                            <div className="form-group"><label className="form-label">Dusun / Jalan</label><input type="text" className="form-control" value={formData.dusun_jalan} onChange={e => setFormData({ ...formData, dusun_jalan: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Provinsi</label>
                                <select className="form-control" value={formData.provinsi} onChange={e => setFormData({ ...formData, provinsi: e.target.value })}>
                                    <option value="">-- Pilih Provinsi --</option>
                                    {provinceList.map(p => (<option key={p} value={p}>{p}</option>))}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Kota / Kabupaten</label>
                                <select className="form-control" value={formData.kota_kabupaten} onChange={e => setFormData({ ...formData, kota_kabupaten: e.target.value })} disabled={!cityList.length}>
                                    <option value="">-- Pilih Kota/Kabupaten --</option>
                                    {cityList.map(c => (<option key={c} value={c}>{c}</option>))}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Kecamatan</label>
                                <select className="form-control" value={formData.kecamatan} onChange={e => setFormData({ ...formData, kecamatan: e.target.value })} disabled={!districtList.length}>
                                    <option value="">-- Pilih Kecamatan --</option>
                                    {districtList.map(d => (<option key={d} value={d}>{d}</option>))}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Desa / Kelurahan</label>
                                <select className="form-control" value={formData.desa_kelurahan} onChange={e => {
                                    const selected = villageList.find(v => v.name === e.target.value);
                                    setFormData(prev => ({ ...prev, desa_kelurahan: e.target.value, kode_pos: selected ? selected.postal_code : '' }));
                                }} disabled={!villageList.length}>
                                    <option value="">-- Pilih Desa/Kelurahan --</option>
                                    {villageList.map(v => (<option key={v.name} value={v.name}>{v.name}</option>))}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Kode Pos</label><input type="text" className="form-control" value={formData.kode_pos} readOnly /></div>
                            <div className="form-group"><label className="form-label">Negara</label><input type="text" className="form-control" value="Indonesia" readOnly /></div>
                        </div>
                    )}
                    {activeTab === 'bantuan' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Yang Membiayai Pendidikan</label><select className="form-control" value={formData.yang_membiayai} onChange={e => setFormData({ ...formData, yang_membiayai: e.target.value })}>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Wali">Wali</option>
                                <option value="Beasiswa">Beasiswa</option>
                                <option value="Lainnya">Lainnya</option>
                            </select></div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">No. KK (Kartu Keluarga)</label><input type="text" className="form-control" value={formData.no_kk} onChange={e => setFormData({ ...formData, no_kk: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Nama Kepala Keluarga</label><input type="text" className="form-control" value={formData.nama_kepala_keluarga} onChange={e => setFormData({ ...formData, nama_kepala_keluarga: e.target.value })} /></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label className="form-label">No. KIP (Kartu Indonesia Pintar)</label><input type="text" className="form-control" value={formData.no_kip} onChange={e => setFormData({ ...formData, no_kip: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">No. KKS / KPS</label><input type="text" className="form-control" value={formData.no_kks_kps} onChange={e => setFormData({ ...formData, no_kks_kps: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Kebutuhan Khusus</label><textarea className="form-control" value={formData.kebutuhan_khusus} onChange={e => setFormData({ ...formData, kebutuhan_khusus: e.target.value })} rows="2" placeholder="Jika ada kebutuhan khusus, sebutkan di sini"></textarea></div>
                            <div className="form-group"><label className="form-label">Kebutuhan Disabilitas</label><textarea className="form-control" value={formData.kebutuhan_disabilitas} onChange={e => setFormData({ ...formData, kebutuhan_disabilitas: e.target.value })} rows="2" placeholder="Jika ada disabilitas, sebutkan di sini"></textarea></div>
                        </div>
                    )}
                    {activeTab === 'status' && (
                        <div className="tab-content animate-in">
                            <div className="form-group"><label className="form-label">Status Santri</label><select className="form-control" value={formData.status_santri} onChange={e => setFormData({ ...formData, status_santri: e.target.value })}>
                                <option>Aktif</option><option>Boyong</option><option>Lulus</option><option>Pindah</option>
                            </select></div>
                            <div className="form-group"><label className="form-label">Foto Profil</label><div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '14px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                    <img src={formData.foto_santri || `https://ui-avatars.com/api/?name=S&background=f1f5f9&color=cbd5e1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                </div>
                                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>{uploading ? 'Proses...' : 'Unggah Foto'}
                                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                                </label>
                            </div></div>
                            <div className="form-group"><label className="form-label">Berkas Pendukung (URL)</label><input type="text" className="form-control" value={formData.berkas_pendukung} onChange={e => setFormData({ ...formData, berkas_pendukung: e.target.value })} placeholder="https://..." /></div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal Detail Santri - Premium View */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Profil Lengkap Santri" width="800px" footer={<button className="btn btn-primary" onClick={() => setIsDetailOpen(false)}>Selesai</button>}>
                {detailData && (
                    <div className="detail-view">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ position: 'relative', padding: '10px', background: '#fff', borderRadius: '28px', boxShadow: 'var(--shadow-lg)' }}>
                                    <img src={detailData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(detailData.nama_siswa)}&size=256&background=1e3a8a&color=fff&bold=true`} style={{ width: '100%', borderRadius: '24px', display: 'block' }} alt="" />
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: '30px', fontWeight: 800 }}>
                                        SANTRI {detailData.status_santri?.toUpperCase() || 'AKTIF'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '5px' }}>{detailData.nama_siswa}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>Stambuk: <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{detailData.stambuk_pondok || '-'}</span> | NIK: {detailData.nik || '-'}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                                    <div><label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Madrasah / Unit</label><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{detailData.madrasah || '-'}</div></div>
                                    <div><label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kelas / Geding</label><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{detailData.kelas || '-'}</div></div>
                                    <div><label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kamar Hunian</label><div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>{detailData.kamar || 'Pusat'}</div></div>
                                    <div><label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tahun Masuk</label><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{detailData.tahun_masuk || '-'}</div></div>
                                </div>
                                <div style={{ marginTop: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '15px' }}>Data Wali & Domisili</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div><small style={{ color: 'var(--text-muted)' }}>Nama Ayah (Wali)</small><div style={{ fontWeight: 600 }}>{detailData.nama_ayah || '-'}</div><div style={{ fontWeight: 800, color: '#25D366', fontSize: '0.8rem' }}><i className="fab fa-whatsapp"></i> {detailData.no_telp_ayah || '-'}</div></div>
                                        <div><small style={{ color: 'var(--text-muted)' }}>Asal Daerah</small><div style={{ fontWeight: 600 }}>{detailData.kota_kabupaten || '-'}</div><div style={{ fontSize: '0.8rem' }}>{detailData.provinsi || '-'}</div></div>
                                    </div>
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.9rem' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: 'var(--danger)' }}></i>{detailData.dusun_jalan}, {detailData.desa_kelurahan}, {detailData.kecamatan}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Mutasi Status */}
            <Modal isOpen={isMutasiOpen} onClose={() => setIsMutasiOpen(false)} title="Mutasi Status Santri" footer={<button className="btn btn-primary" onClick={handleMutasi}><i className="fas fa-exchange-alt"></i> Proses Mutasi</button>}>
                {mutasiData && (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px' }}>
                            <img src={mutasiData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(mutasiData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} alt={mutasiData.nama_siswa} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' }} />
                            <h3 style={{ marginTop: '0.5rem', fontWeight: 800 }}>{mutasiData.nama_siswa}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{mutasiData.stambuk_pondok} • {mutasiData.kamar}</p>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Status Baru</label>
                                <select className="form-control" value={mutasiForm.status_santri} onChange={e => setMutasiForm({ ...mutasiForm, status_santri: e.target.value })} style={{ fontWeight: 700 }}>
                                    <option value="Boyong">Boyong (Pulang Sementara)</option>
                                    <option value="Pindah">Pindah (Ke Pondok Lain)</option>
                                    <option value="Lulus">Lulus</option>
                                </select>
                            </div>
                            {mutasiForm.status_santri === 'Pindah' && (
                                <>
                                    <div><label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Pindah Ke Pondok</label><input type="text" className="form-control" placeholder="Nama pondok tujuan..." value={mutasiForm.pindah_ke} onChange={e => setMutasiForm({ ...mutasiForm, pindah_ke: e.target.value })} required /></div>
                                    <div><label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Tahun Pindah</label><input type="text" className="form-control" placeholder="2024" value={mutasiForm.tahun_pindah} onChange={e => setMutasiForm({ ...mutasiForm, tahun_pindah: e.target.value })} /></div>
                                </>
                            )}
                            {mutasiForm.status_santri === 'Boyong' && (
                                <div><label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Tanggal Boyong</label><input type="date" className="form-control" value={mutasiForm.tanggal_boyong} onChange={e => setMutasiForm({ ...mutasiForm, tanggal_boyong: e.target.value })} /></div>
                            )}
                            {mutasiForm.status_santri === 'Lulus' && (
                                <div><label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Tahun Lulus</label><input type="text" className="form-control" placeholder="2024" value={mutasiForm.tahun_pindah} onChange={e => setMutasiForm({ ...mutasiForm, tahun_pindah: e.target.value })} /></div>
                            )}
                            <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}><i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i><strong>Perhatian:</strong> Setelah mutasi, data santri akan dipindahkan ke arsip dan status tidak bisa dikembalikan ke Aktif.</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Professional Print Footer */}
            <div className="print-footer-corporate"><span>Dokumen ini dihasilkan secara otomatis oleh SIM-PPDS Darussalam Lirboyo pada {new Date().toLocaleString('id-ID')}</span></div>
        </div>
    );
}
