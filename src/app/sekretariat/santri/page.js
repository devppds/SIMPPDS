'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiCall, exportToExcel } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components (Satu Pintu)
import FileUploader from '@/components/FileUploader';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import DataViewContainer from '@/components/DataViewContainer';
import ConfirmModal from '@/components/ConfirmModal';
import ModalTabs from '@/components/ModalTabs';

export default function SantriPage() {
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    const [filterStatus, setFilterStatus] = useState('Aktif');
    const [filterMadrasah, setFilterMadrasah] = useState('Semua');
    const [activeTab, setActiveTab] = useState('umum');
    const [listKelas, setListKelas] = useState([]);
    const [listKamar, setListKamar] = useState([]);
    const [isMutasiOpen, setIsMutasiOpen] = useState(false);
    const [mutasiData, setMutasiData] = useState(null);
    const [mutasiForm, setMutasiForm] = useState({ status_santri: 'Boyong', pindah_ke: '', tahun_pindah: '', tanggal_boyong: new Date().toISOString().split('T')[0] });

    // Confirm States
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);

    const {
        data: santri, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData: detailData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('santri', {
        stambuk_pondok: '', stambuk_madrasah: '', nama_siswa: '', tahun_masuk: '', kamar: '', status_mb: 'Baru', madrasah: '', kelas: '',
        nisn: '', tempat_tanggal_lahir: '', jenis_kelamin: 'Laki-laki', agama: 'Islam', kewarganegaraan: 'WNI',
        anak_ke: '', jumlah_saudara: '', alamat_lengkap: '', dusun_jalan: '', rt_rw: '', desa_kelurahan: '', kecamatan: '',
        kota_kabupaten: '', provinsi: '', kode_pos: '', hobi: '', cita_cita: '', pendidikan_terakhir: '', asal_sekolah: '', no_ijazah: '',
        nama_ayah: '', tempat_tanggal_lahir_ayah: '', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_telp_ayah: '',
        nama_ibu: '', tempat_tanggal_lahir_ibu: '', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_telp_ibu: '',
        status_santri: 'Aktif', tanggal_nonaktif: '', alasan_nonaktif: '', foto_santri: '', pindah_ke: '', tahun_pindah: '', tanggal_boyong: ''
    });

    // Optimized Data Loading
    const loadEnrichedData = useCallback(async () => {
        // useDataManagement already fetches 'santri' data. 
        // We only need to fetch auxiliary master data once.
        try {
            const [resKelas, resKamar] = await Promise.all([
                apiCall('getData', 'GET', { type: 'master_kelas' }),
                apiCall('getData', 'GET', { type: 'kamar' })
            ]);
            setListKelas((resKelas || []).sort((a, b) => a.urutan - b.urutan));
            setListKamar((resKamar || []).map(r => ({ value: `${r.asrama} ${r.nama_kamar.toString().padStart(2, '0')}`, label: `${r.asrama} ${r.nama_kamar.toString().padStart(2, '0')}` })));
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    useEffect(() => {
        fetch('https://ibnux.github.io/data-indonesia/provinsi.json').then(res => res.json()).then(setProvinces);
    }, []);

    useEffect(() => {
        if (!formData.provinsi) return;
        const p = provinces.find(x => x.nama === formData.provinsi);
        if (p) fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${p.id}.json`).then(res => res.json()).then(setCities);
    }, [formData.provinsi, provinces]);

    const stats = useMemo(() => ([
        { title: 'Total Santri', value: santri.length, icon: 'fas fa-users', color: '#1e3a8a' },
        { title: 'Santri Aktif', value: santri.filter(s => s.status_santri === 'Aktif').length, icon: 'fas fa-user-check', color: '#16a34a' },
        { title: 'Lulus & Boyong', value: santri.filter(s => s.status_santri !== 'Aktif').length, icon: 'fas fa-graduation-cap', color: '#ca8a04' }
    ]), [santri]);

    const displayData = useMemo(() => {
        return santri.filter(s => {
            // 1. Filter by Status
            const matchStatus = filterStatus === 'Aktif'
                ? (!s.status_santri || s.status_santri === 'Aktif')
                : s.status_santri === filterStatus;
            if (!matchStatus) return false;

            // 2. Filter by Search
            const matchSearch = (s.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase());
            if (!matchSearch) return false;

            // 3. Filter by Unit/Madrasah
            const mdr = (s.madrasah || '').toUpperCase();
            const kls = (s.kelas || '').toUpperCase();
            let matchMdr = filterMadrasah === 'Semua';
            if (filterMadrasah === 'MHM') matchMdr = mdr === 'MHM' || kls.includes('IBTIDA') || kls.includes('ALIYYAH');
            else if (filterMadrasah === 'MIU') matchMdr = mdr === 'MIU' || kls.includes('ULA') || kls.includes('WUSTHO');

            return matchMdr;
        });
    }, [santri, search, filterStatus, filterMadrasah]);

    const columns = [
        { key: 'foto', label: 'Foto', render: (row) => <img src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> },
        { key: 'nama_siswa', label: 'Nama Lengkap', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small>{row.stambuk_pondok}</small></div> },
        { key: 'kelas', label: 'Pendidikan', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.kelas}</div><small>{row.madrasah}</small></div> },
        { key: 'kamar', label: 'Kamar', render: (row) => <span className="th-badge">{row.kamar}</span> },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)}><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canEdit && row.status_santri === 'Aktif' && <button className="btn-vibrant btn-vibrant-orange" onClick={() => { setMutasiData(row); setIsMutasiOpen(true); }}><i className="fas fa-exchange-alt"></i></button>}
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setDeleteConfirm({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    const fileInputRef = useRef(null);

    const confirmDeletion = async () => {
        await handleDelete(deleteConfirm.id, null);
        setDeleteConfirm({ open: false, id: null });
        loadEnrichedData();
    };

    const handleExport = () => {
        const headers = [
            "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "madrasah", "kelas", "nama_siswa",
            "tempat_tanggal_lahir", "jenis_kelamin", "nisn", "asal_sekolah", "alamat", "no_telp_ayah", "nama_ayah", "nama_ibu", "status_santri"
        ];
        exportToExcel(displayData, 'Data_Santri_Lengkap', headers);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').filter(r => r.trim());
            if (rows.length < 2) return;

            const headers = rows[0].split(';').map(h => h.replace(/^"|"$/g, '').trim());
            const dataToImport = rows.slice(1).map(row => {
                const values = row.split(';').map(v => v.replace(/^"|"$/g, '').trim());
                const obj = {};
                headers.forEach((h, i) => {
                    const key = h.toLowerCase().replace(/ /g, '_');
                    obj[key] = values[i] || '';
                });
                return obj;
            });

            setLoading(true);
            let successCount = 0;
            for (const item of dataToImport) {
                try {
                    // Filter focus on essential fields for import to avoid empty strings on complex fields
                    await apiCall('saveData', 'POST', { type: 'santri', data: item });
                    successCount++;
                } catch (err) {
                    console.error("Gagal import baris:", item, err);
                }
            }
            setLoading(false);
            showToast(`Berhasil mengimport ${successCount} data santri.`, 'success');
            loadEnrichedData();
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="view-container animate-in">
            <KopSurat judul={`Database Santri - ${filterStatus}`} subJudul={`Tiga Unit: MHM, MIU, Madin`} hideOnScreen={true} />
            <StatsPanel items={stats} />

            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" style={{ display: 'none' }} />

            <DataViewContainer
                title="Management Data Santri"
                subtitle={`Menampilkan ${displayData.length} data sesuai filter`}
                headerActions={(<>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                        const templateHeaders = [
                            "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "madrasah", "kelas", "nama_siswa",
                            "tempat_tanggal_lahir", "jenis_kelamin", "nisn", "asal_sekolah", "alamat", "no_telp_ayah", "nama_ayah", "nama_ibu", "status_santri"
                        ];
                        const exampleData = [{
                            stambuk_pondok: '12345', stambuk_madrasah: 'M678', tahun_masuk: '2024', kamar: 'A 01', madrasah: 'MHM',
                            kelas: '1 IBTIDA', nama_siswa: 'Zaid bin Tsabit', tempat_tanggal_lahir: 'KEDIRI, 01-01-2010',
                            jenis_kelamin: 'L', nisn: '0012345678', asal_sekolah: 'SDN 1 Lirboyo', alamat: 'Dusun Lirboyo',
                            no_telp_ayah: '08123456789', nama_ayah: 'Abdullah', nama_ibu: 'Aminah', status_santri: 'Aktif'
                        }];
                        exportToExcel(exampleData, 'Template_Import_Santri', templateHeaders);
                    }} title="Download Template Excel">
                        <i className="fas fa-download"></i> Template
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} title="Import Data CSV">
                        <i className="fas fa-upload"></i> Import
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExport} title="Export Excel">
                        <i className="fas fa-file-excel" style={{ color: '#16a34a' }}></i> Export
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()} title="Print Laporan">
                        <i className="fas fa-print"></i>
                    </button>
                    {canEdit && <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('umum'); openModal(); }}>
                        <i className="fas fa-plus"></i> Tambah Santri
                    </button>}
                </>)}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama/stambuk..." }}
                filters={(<>
                    <SelectInput value={filterMadrasah} onChange={e => setFilterMadrasah(e.target.value)} options={['Semua', 'MHM', 'MIU']} style={{ width: '150px', marginBottom: 0 }} placeholder="Unit" />
                    <SelectInput value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={['Aktif', 'Boyong', 'Pindah', 'Lulus']} style={{ width: '180px', marginBottom: 0 }} placeholder="Status" />
                </>)}
                tableProps={{ columns, data: displayData, loading }}
            />

            {/* Modal Input/Edit dengan ModalTabs (Satu Pintu) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data" : "Santri Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <ModalTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { key: 'umum', label: 'Identitas Pondok', icon: 'fas fa-mosque' },
                        { key: 'pribadi', label: 'Data Diri', icon: 'fas fa-user' },
                        { key: 'wali', label: 'Orang Tua / Wali', icon: 'fas fa-users' },
                        { key: 'alamat', label: 'Domisili', icon: 'fas fa-map-marker-alt' },
                        { key: 'status', label: 'Berkas & Status', icon: 'fas fa-file-contract' }
                    ]}
                />

                <div style={{ marginTop: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }} className="custom-scrollbar">

                    {/* --- TAB 1: IDENTITAS PONDOK --- */}
                    {activeTab === 'umum' && (
                        <div className="animate-in">
                            <TextInput label="Nama Lengkap Santri" value={formData.nama_siswa} onChange={e => setFormData({ ...formData, nama_siswa: e.target.value })} required icon="fas fa-user-graduate" placeholder="Sesuai Ijazah / Akta" />

                            <div className="form-grid">
                                <TextInput label="Stambuk Pondok" value={formData.stambuk_pondok} onChange={e => setFormData({ ...formData, stambuk_pondok: e.target.value })} icon="fas fa-id-card" placeholder="Nomor Induk Pondok" />
                                <TextInput label="Stambuk Madrasah" value={formData.stambuk_madrasah} onChange={e => setFormData({ ...formData, stambuk_madrasah: e.target.value })} icon="fas fa-id-card-alt" />
                            </div>

                            <div className="form-grid">
                                <SelectInput label="Kelas / Madrasah" value={formData.kelas} onChange={e => { const s = listKelas.find(k => k.nama_kelas === e.target.value); setFormData({ ...formData, kelas: e.target.value, madrasah: s ? s.lembaga : '' }); }} options={listKelas.map(k => k.nama_kelas)} icon="fas fa-chalkboard-teacher" />
                                <TextInput label="Unit Madrasah" value={formData.madrasah} readOnly style={{ background: '#f1f5f9' }} icon="fas fa-school" />
                            </div>

                            <div className="form-grid">
                                <SelectInput label="Kamar / Asrama" value={formData.kamar} onChange={e => setFormData({ ...formData, kamar: e.target.value })} options={listKamar.map(k => k.value)} icon="fas fa-bed" />
                                <TextInput label="Tahun Masuk" type="number" value={formData.tahun_masuk} onChange={e => setFormData({ ...formData, tahun_masuk: e.target.value })} icon="fas fa-calendar-alt" />
                            </div>

                            <SelectInput label="Status Mukim" value={formData.status_mb} onChange={e => setFormData({ ...formData, status_mb: e.target.value })} options={['Mukim', 'Boyong / Laju', 'Baru']} icon="fas fa-luggage-cart" />
                        </div>
                    )}

                    {/* --- TAB 2: DATA DIRI (PERSONAL) --- */}
                    {activeTab === 'pribadi' && (
                        <div className="animate-in">
                            <div className="form-grid">
                                <TextInput label="NISN" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} icon="fas fa-hashtag" />
                                <SelectInput label="Jenis Kelamin" value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })} options={['Laki-laki', 'Perempuan']} icon="fas fa-venus-mars" />
                            </div>

                            <div className="form-grid">
                                <TextInput label="Tempat Lahir" value={formData.tempat_tanggal_lahir ? formData.tempat_tanggal_lahir.split(',')[0] : ''} onChange={e => {
                                    const parts = (formData.tempat_tanggal_lahir || '').split(',');
                                    const datePart = parts.length > 1 ? parts[1].trim() : '';
                                    setFormData({ ...formData, tempat_tanggal_lahir: `${e.target.value}, ${datePart}` });
                                }} icon="fas fa-map-pin" />
                                <TextInput label="Tanggal Lahir" type="date" value={formData.tempat_tanggal_lahir ? formData.tempat_tanggal_lahir.split(',')[1]?.trim() : ''} onChange={e => {
                                    const parts = (formData.tempat_tanggal_lahir || '').split(',');
                                    const placePart = parts[0] || '';
                                    setFormData({ ...formData, tempat_tanggal_lahir: `${placePart}, ${e.target.value}` });
                                }} />
                            </div>

                            <div className="form-grid">
                                <TextInput label="NIK / No. KTP" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} icon="fas fa-id-badge" />
                                <SelectInput label="Kewarganegaraan" value={formData.kewarganegaraan} onChange={e => setFormData({ ...formData, kewarganegaraan: e.target.value })} options={['WNI', 'WNA']} />
                            </div>

                            <div className="form-grid">
                                <TextInput label="Anak Ke-" type="number" value={formData.anak_ke} onChange={e => setFormData({ ...formData, anak_ke: e.target.value })} />
                                <TextInput label="Dari Bersaudara" type="number" value={formData.jumlah_saudara} onChange={e => setFormData({ ...formData, jumlah_saudara: e.target.value })} />
                            </div>

                            <div className="form-grid">
                                <TextInput label="Hobi" value={formData.hobi} onChange={e => setFormData({ ...formData, hobi: e.target.value })} icon="fas fa-running" />
                                <TextInput label="Cita-cita" value={formData.cita_cita} onChange={e => setFormData({ ...formData, cita_cita: e.target.value })} icon="fas fa-star" />
                            </div>

                            <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Riwayat Pendidikan Sebelumnya</h4>
                            <div className="form-grid">
                                <SelectInput label="Jenjang Terakhir" value={formData.pendidikan_terakhir} onChange={e => setFormData({ ...formData, pendidikan_terakhir: e.target.value })} options={['SD/MI', 'SMP/MTs', 'SMA/MA', 'Lainnya']} />
                                <TextInput label="Nama Sekolah Asal" value={formData.asal_sekolah} onChange={e => setFormData({ ...formData, asal_sekolah: e.target.value })} icon="fas fa-school" />
                            </div>
                            <TextInput label="Nomor Ijazah Terakhir" value={formData.no_ijazah} onChange={e => setFormData({ ...formData, no_ijazah: e.target.value })} icon="fas fa-certificate" />
                        </div>
                    )}

                    {/* --- TAB 3: ORANG TUA / WALI --- */}
                    {activeTab === 'wali' && (
                        <div className="animate-in">
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}><i className="fas fa-male"></i> Data Ayah</h3>
                                <TextInput label="Nama Lengkap Ayah" value={formData.nama_ayah} onChange={e => setFormData({ ...formData, nama_ayah: e.target.value })} required icon="fas fa-user-tie" />
                                <div className="form-grid">
                                    <TextInput label="NIK Ayah" value={formData.nik_ayah} onChange={e => setFormData({ ...formData, nik_ayah: e.target.value })} icon="fas fa-id-card" />
                                    <TextInput label="No. Handphone (WA)" value={formData.no_telp_ayah} onChange={e => setFormData({ ...formData, no_telp_ayah: e.target.value })} icon="fab fa-whatsapp" />
                                </div>
                                <div className="form-grid">
                                    <SelectInput label="Pendidikan Ayah" value={formData.pendidikan_ayah} onChange={e => setFormData({ ...formData, pendidikan_ayah: e.target.value })} options={['SD', 'SMP', 'SMA', 'S1', 'S2', 'S3', 'Tidak Sekolah']} />
                                    <TextInput label="Pekerjaan Ayah" value={formData.pekerjaan_ayah} onChange={e => setFormData({ ...formData, pekerjaan_ayah: e.target.value })} icon="fas fa-briefcase" />
                                </div>
                                <SelectInput label="Penghasilan Bulanan" value={formData.penghasilan_ayah} onChange={e => setFormData({ ...formData, penghasilan_ayah: e.target.value })} options={['< 1 Juta', '1 - 3 Juta', '3 - 5 Juta', '> 5 Juta']} icon="fas fa-wallet" />
                            </div>

                            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#be123c', marginBottom: '1rem' }}><i className="fas fa-female"></i> Data Ibu</h3>
                                <TextInput label="Nama Lengkap Ibu" value={formData.nama_ibu} onChange={e => setFormData({ ...formData, nama_ibu: e.target.value })} required icon="fas fa-user" />
                                <div className="form-grid">
                                    <TextInput label="NIK Ibu" value={formData.nik_ibu} onChange={e => setFormData({ ...formData, nik_ibu: e.target.value })} icon="fas fa-id-card" />
                                    <TextInput label="No. Handphone (WA)" value={formData.no_telp_ibu} onChange={e => setFormData({ ...formData, no_telp_ibu: e.target.value })} icon="fab fa-whatsapp" />
                                </div>
                                <div className="form-grid">
                                    <SelectInput label="Pendidikan Ibu" value={formData.pendidikan_ibu} onChange={e => setFormData({ ...formData, pendidikan_ibu: e.target.value })} options={['SD', 'SMP', 'SMA', 'S1', 'S2', 'S3', 'Tidak Sekolah']} />
                                    <TextInput label="Pekerjaan Ibu" value={formData.pekerjaan_ibu} onChange={e => setFormData({ ...formData, pekerjaan_ibu: e.target.value })} icon="fas fa-briefcase" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 4: ALAMAT (DOMISILI) --- */}
                    {activeTab === 'alamat' && (
                        <div className="animate-in">
                            <TextInput label="Alamat Lengkap (Dusun/Jalan)" value={formData.alamat_lengkap} onChange={e => setFormData({ ...formData, alamat_lengkap: e.target.value })} icon="fas fa-map-signs" placeholder="Cth: Jl. KH. Hasyim Asy'ari No. 99" />
                            <div className="form-grid">
                                <TextInput label="Dusun / Lingkungan" value={formData.dusun_jalan} onChange={e => setFormData({ ...formData, dusun_jalan: e.target.value })} />
                                <TextInput label="RT / RW" value={formData.rt_rw} onChange={e => setFormData({ ...formData, rt_rw: e.target.value })} placeholder="001/002" />
                            </div>
                            <div className="form-grid">
                                <TextInput label="Desa / Kelurahan" value={formData.desa_kelurahan} onChange={e => setFormData({ ...formData, desa_kelurahan: e.target.value })} icon="fas fa-building" />
                                <TextInput label="Kecamatan" value={formData.kecamatan} onChange={e => setFormData({ ...formData, kecamatan: e.target.value })} icon="fas fa-landmark" />
                            </div>
                            <div className="form-grid">
                                <TextInput label="Kota / Kabupaten" value={formData.kota_kabupaten} onChange={e => setFormData({ ...formData, kota_kabupaten: e.target.value })} icon="fas fa-city" />
                                <SelectInput label="Provinsi" value={formData.provinsi} onChange={e => setFormData({ ...formData, provinsi: e.target.value })} options={provinces.map(p => p.nama)} icon="fas fa-map" />
                            </div>
                            <TextInput label="Kode Pos" type="number" value={formData.kode_pos} onChange={e => setFormData({ ...formData, kode_pos: e.target.value })} icon="fas fa-mail-bulk" />
                        </div>
                    )}

                    {/* --- TAB 5: BERKAS & STATUS --- */}
                    {activeTab === 'status' && (
                        <div className="animate-in">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                <FileUploader
                                    label="Foto Santri (Formal)"
                                    currentUrl={formData.foto_santri}
                                    onUploadSuccess={(url) => setFormData({ ...formData, foto_santri: url })}
                                    folder="santri_photos"
                                    previewShape="circle"
                                />
                                <small style={{ color: '#94a3b8', display: 'block', marginTop: '10px' }}>Format: JPG/PNG, Max 2MB. Wajah terlihat jelas.</small>
                            </div>

                            <SelectInput label="Status Keaktifan" value={formData.status_santri} onChange={e => setFormData({ ...formData, status_santri: e.target.value })} options={['Aktif', 'Boyong', 'Pindah', 'Lulus', 'Non-Aktif']} icon="fas fa-toggle-on" />

                            {formData.status_santri !== 'Aktif' && (
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fcd34d', marginTop: '10px' }}>
                                    <TextInput label="Tanggal Non-Aktif" type="date" value={formData.tanggal_nonaktif} onChange={e => setFormData({ ...formData, tanggal_nonaktif: e.target.value })} />
                                    <TextInput label="Alasan" value={formData.alasan_nonaktif} onChange={e => setFormData({ ...formData, alasan_nonaktif: e.target.value })} placeholder="Alasan berhenti..." />
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Dokumen Penunjang (Opsional)</h4>
                                <FileUploader label="Scan Kartu Keluarga (KK)" folder="dokumen_santri" labelShort="Upload KK" onUploadSuccess={url => setFormData({ ...formData, file_kk: url })} />
                                <div style={{ height: '10px' }}></div>
                                <FileUploader label="Scan Akta Kelahiran" folder="dokumen_santri" labelShort="Upload Akta" onUploadSuccess={url => setFormData({ ...formData, file_akta: url })} />
                            </div>
                        </div>
                    )}

                </div>
            </Modal>


            {/* Modal View Detail */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Data Santri" width="800px">
                {detailData && (
                    <div className="view-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <img
                                src={detailData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(detailData.nama_siswa)}&background=1e3a8a&color=fff&size=256&bold=true`}
                                alt={detailData.nama_siswa}
                                style={{ width: '100%', maxWidth: '200px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1rem' }}
                            />
                            <div className={`status-badge ${detailData.status_santri?.toLowerCase()}`} style={{ display: 'inline-block', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', background: detailData.status_santri === 'Aktif' ? '#dcfce7' : '#fee2e2', color: detailData.status_santri === 'Aktif' ? '#166534' : '#991b1b' }}>
                                {detailData.status_santri}
                            </div>
                        </div>
                        <div className="info-grid">
                            <h2 style={{ marginBottom: '5px' }}>{detailData.nama_siswa}</h2>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{detailData.stambuk_pondok} • {detailData.kelas} ({detailData.madrasah})</p>

                            <h4 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>Informasi Pribadi</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div><small style={{ color: '#94a3b8' }}>TTL</small><div>{detailData.tempat_tanggal_lahir}</div></div>
                                <div><small style={{ color: '#94a3b8' }}>NISN</small><div>{detailData.nisn || '-'}</div></div>
                                <div><small style={{ color: '#94a3b8' }}>Asrama</small><div>{detailData.kamar}</div></div>
                                <div><small style={{ color: '#94a3b8' }}>Tahun Masuk</small><div>{detailData.tahun_masuk || '-'}</div></div>
                            </div>

                            <h4 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>Alamat & Wali</h4>
                            <div style={{ marginBottom: '1rem' }}>
                                <small style={{ color: '#94a3b8' }}>Alamat Lengkap</small>
                                <div>{detailData.alamat_lengkap || '-'} {detailData.dusun_jalan}, {detailData.desa_kelurahan}, {detailData.kecamatan}, {detailData.kota_kabupaten}, {detailData.provinsi}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><small style={{ color: '#94a3b8' }}>Ayah</small><div>{detailData.nama_ayah} ({detailData.no_telp_ayah || '-'})</div></div>
                                <div><small style={{ color: '#94a3b8' }}>Ibu</small><div>{detailData.nama_ibu} ({detailData.no_telp_ibu || '-'})</div></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Mutasi (Boyong/Pindah) */}
            <Modal isOpen={isMutasiOpen} onClose={() => setIsMutasiOpen(false)} title="Proses Mutasi Santri">
                <div style={{ padding: '10px' }}>
                    <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#92400e', border: '1px solid #fcd34d' }}>
                        <i className="fas fa-exclamation-triangle"></i> Santri yang dimutasi (Boyong/Pindah) statusnya akan menjadi non-aktif dan tidak muncul di absensi.
                    </div>
                    <SelectInput label="Jenis Mutasi" value={mutasiForm.status_santri} onChange={e => setMutasiForm({ ...mutasiForm, status_santri: e.target.value })} options={['Boyong', 'Pindah']} />
                    <TextInput label="Tanggal Efektif" type="date" value={mutasiForm.tanggal_boyong} onChange={e => setMutasiForm({ ...mutasiForm, tanggal_boyong: e.target.value })} />
                    {mutasiForm.status_santri === 'Pindah' && (
                        <TextInput label="Pindah Ke (Sekolah/Pondok)" value={mutasiForm.pindah_ke} onChange={e => setMutasiForm({ ...mutasiForm, pindah_ke: e.target.value })} />
                    )}
                    <TextInput label="Alasan / Keterangan" value={mutasiForm.alasan_nonaktif} onChange={e => setMutasiForm({ ...mutasiForm, alasan_nonaktif: e.target.value })} />

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={async () => {
                            if (!mutasiData) return;
                            await handleSave(null, { ...mutasiData, ...mutasiForm });
                            setIsMutasiOpen(false);
                            setMutasiData(null);
                        }}>Simpan Perubahan</button>
                    </div>
                </div>
            </Modal>

            {/* ConfirmModal (Satu Pintu) */}
            <ConfirmModal
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, id: null })}
                onConfirm={confirmDeletion}
                title="Hapus Data Santri?"
                message="Tindakan ini tidak dapat dibatalkan. Seluruh riwayat pembayaran dan absensi santri ini mungkin terpengaruh."
                confirmText="Ya, Hapus Permanen"
            />
        </div>
    );
}
