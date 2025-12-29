'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resKelas, resKamar] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'master_kelas' }),
                apiCall('getData', 'GET', { type: 'kamar' })
            ]);
            let filtered = (res || []).filter(s => filterStatus === 'Aktif' ? (!s.status_santri || s.status_santri === 'Aktif') : s.status_santri === filterStatus);
            setData(filtered);
            setListKelas((resKelas || []).sort((a, b) => a.urutan - b.urutan));
            setListKamar((resKamar || []).map(r => ({ value: `${r.asrama} ${r.nama_kamar.toString().padStart(2, '0')}`, label: `${r.asrama} ${r.nama_kamar.toString().padStart(2, '0')}` })));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [filterStatus, setData, setLoading]);

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

    const displayData = santri.filter(s => {
        const matchSearch = (s.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) || (s.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase());
        const mdr = (s.madrasah || '').toUpperCase();
        const kls = (s.kelas || '').toUpperCase();
        let matchMdr = filterMadrasah === 'Semua';
        if (filterMadrasah === 'MHM') matchMdr = mdr === 'MHM' || kls.includes('IBTIDA') || kls.includes('ALIYYAH');
        else if (filterMadrasah === 'MIU') matchMdr = mdr === 'MIU' || kls.includes('ULA') || kls.includes('WUSTHO');
        return matchSearch && matchMdr;
    });

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

    const confirmDeletion = async () => {
        await handleDelete(deleteConfirm.id, null);
        setDeleteConfirm({ open: false, id: null });
        loadEnrichedData();
    };

    const handleExport = () => {
        const headers = ['stambuk_pondok', 'nama_siswa', 'madrasah', 'kelas', 'kamar', 'status_santri', 'tahun_masuk', 'tempat_tanggal_lahir', 'no_telp_ayah'];
        exportToExcel(displayData, 'Data_Santri', headers);
    };

    return (
        <div className="view-container animate-in">
            <KopSurat judul={`Database Santri - ${filterStatus}`} subJudul={`Tiga Unit: MHM, MIU, Madin`} hideOnScreen={true} />
            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Data Santri"
                subtitle={`Menampilkan ${displayData.length} data sesuai filter`}
                headerActions={(<>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                        const headers = ['stambuk_pondok', 'nama_siswa', 'tahun_masuk', 'kamar', 'madrasah', 'kelas', 'tempat_tanggal_lahir', 'no_telp_ayah', 'alamat_lengkap'];
                        exportToExcel([{ stambuk_pondok: '12345', nama_siswa: 'CONTOH NAMA', tahun_masuk: '2024', kamar: 'A 01', madrasah: 'MHM', kelas: '1 IBTIDA', tempat_tanggal_lahir: 'KEDIRI, 01-01-2010', no_telp_ayah: '08123456789', alamat_lengkap: 'JL. LIRBOYO NO. 1' }], 'Template_Santri', headers);
                    }} title="Download Template Excel">
                        <i className="fas fa-download"></i> Template
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
                        { key: 'umum', label: 'Identitas', icon: 'fas fa-id-card' },
                        { key: 'pribadi', label: 'Personal', icon: 'fas fa-user' },
                        { key: 'wali', label: 'Wali', icon: 'fas fa-users' },
                        { key: 'alamat', label: 'Alamat', icon: 'fas fa-map-marked-alt' },
                        { key: 'status', label: 'Berkas', icon: 'fas fa-file-alt' }
                    ]}
                />
                <div style={{ marginTop: '1rem' }}>
                    {activeTab === 'umum' && <>
                        <TextInput label="Nama Lengkap" value={formData.nama_siswa} onChange={e => setFormData({ ...formData, nama_siswa: e.target.value })} required />
                        <div className="form-grid">
                            <TextInput label="Stambuk" value={formData.stambuk_pondok} onChange={e => setFormData({ ...formData, stambuk_pondok: e.target.value })} />
                            <SelectInput label="Kelas" value={formData.kelas} onChange={e => { const s = listKelas.find(k => k.nama_kelas === e.target.value); setFormData({ ...formData, kelas: e.target.value, madrasah: s ? s.lembaga : '' }); }} options={listKelas.map(k => k.nama_kelas)} />
                        </div>
                        <SelectInput label="Kamar" value={formData.kamar} onChange={e => setFormData({ ...formData, kamar: e.target.value })} options={listKamar} />
                    </>}
                    {activeTab === 'pribadi' && <>
                        <TextInput label="NISN" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} />
                        <TextInput label="Jenis Kelamin" value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })} />
                    </>}
                    {activeTab === 'status' && <>
                        <SelectInput label="Status" value={formData.status_santri} onChange={e => setFormData({ ...formData, status_santri: e.target.value })} options={['Aktif', 'Boyong', 'Pindah', 'Lulus']} />
                        <FileUploader currentUrl={formData.foto_santri} onUploadSuccess={(url) => setFormData({ ...formData, foto_santri: url })} folder="santri_photos" />
                    </>}
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
