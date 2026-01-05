'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import FileUploader from '@/components/FileUploader';

export default function PengurusPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [listJabatan, setListJabatan] = useState([]);
    const [listDivisi, setListDivisi] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mounted, setMounted] = useState(false);

    const getAcademicYear = useCallback(() => {
        try {
            const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                day: 'numeric', month: 'numeric', year: 'numeric'
            }).formatToParts(new Date());
            const hYearStr = parts.find(p => p.type === 'year')?.value;
            const hMonthStr = parts.find(p => p.type === 'month')?.value;
            const hYear = parseInt(hYearStr ? hYearStr.split(' ')[0] : '1447');
            const hMonth = parseInt(hMonthStr || '1');
            if (hMonth >= 10) return `${hYear}/${hYear + 1} H`;
            return `${hYear - 1}/${hYear} H`;
        } catch (e) { return "1446/1447 H"; }
    }, []);

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('pengurus', {
        nama: '', jabatan: '', divisi: '', no_hp: '', status: 'Aktif',
        tahun_mulai: '', tahun_akhir: '', foto_pengurus: '', tanggal_nonaktif: ''
    });

    useEffect(() => {
        setMounted(true);
        // Only calculate on client
        setFormData(prev => ({
            ...prev,
            tahun_mulai: getAcademicYear()
        }));
        setMutasiData(prev => ({
            ...prev,
            tanggal: new Date().toISOString().split('T')[0]
        }));
    }, [getAcademicYear, setFormData]);

    const { showToast } = useToast();
    const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
    const [mutasiData, setMutasiData] = useState({ id: null, nama: '', status: 'Non-Aktif', tanggal: '' });

    const openMutasi = (row) => {
        setMutasiData({
            id: row.id,
            nama: row.nama,
            status: 'Non-Aktif',
            tanggal: new Date().toISOString().split('T')[0]
        });
        setIsMutasiModalOpen(true);
    };

    const handleMutasi = async () => {
        try {
            setLoading(true);
            const target = data.find(d => d.id === mutasiData.id);
            if (!target) return;

            const updated = {
                ...target,
                status: mutasiData.status,
                tanggal_nonaktif: mutasiData.tanggal,
                tahun_akhir: mutasiData.tanggal.split('-')[0] // Auto-fill tahun akhir
            };

            await apiCall('saveData', 'POST', { type: 'pengurus', id: mutasiData.id, data: updated });
            showToast("Mutasi Berhasil!", "success");
            setIsMutasiModalOpen(false);
            loadEnrichedData();
        } catch (e) {
            console.error(e);
            showToast("Gagal melakukan mutasi: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resMaster] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pengurus' }),
                apiCall('getData', 'GET', { type: 'master_jabatan' })
            ]);
            setData(res || []);
            const master = (resMaster || []).sort((a, b) => a.urutan - b.urutan);
            setListJabatan(master.filter(x => x.kelompok === 'Dewan Harian'));
            setListDivisi(master.filter(x => x.kelompok === 'Pleno'));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => [
        { title: 'Total Pengurus Aktif', value: data.filter(d => d.status === 'Aktif' || !d.status).length, icon: 'fas fa-id-card', color: 'var(--primary)' },
        { title: 'Terbagi di Divisi', value: [...new Set(data.filter(d => d.status === 'Aktif' || !d.status).map(d => d.divisi))].filter(Boolean).length, icon: 'fas fa-sitemap', color: 'var(--success)' },
        { title: 'Total Non-Aktif', value: data.filter(d => d.status !== 'Aktif' && d.status).length, icon: 'fas fa-user-minus', color: 'var(--warning)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.status === 'Aktif' || !d.status) && (
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.divisi || '').toLowerCase().includes(search.toLowerCase())
        ));

    const columns = [
        { key: 'foto_pengurus', label: 'Profil', width: '80px', render: (row) => <img src={row.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} alt="" /> },
        { key: 'nama', label: 'Nama Lengkap', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama}</div><small>WA: {row.no_hp ? <a href={`https://wa.me/${row.no_hp.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>{row.no_hp}</a> : '-'}</small></div> },
        { key: 'jabatan', label: 'Jabatan', render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.jabatan || '-'}</span> },
        { key: 'divisi', label: 'Divisi', className: 'hide-mobile', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{row.divisi || '-'}</span> },
        { key: 'status', label: 'Status', render: (row) => <span className="th-badge" style={{ background: row.status === 'Aktif' ? '#dcfce7' : '#f1f5f9', color: row.status === 'Aktif' ? '#166534' : '#64748b' }}>{row.status?.toUpperCase() || 'AKTIF'}</span> },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canEdit && row.status === 'Aktif' && <button className="btn-vibrant btn-vibrant-yellow" onClick={() => openMutasi(row)} title="Mutasi / Non-Aktif"><i className="fas fa-exchange-alt"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Struktur Organisasi & Kepengurusan" subJudul="Data amanah dan profil pelayan santri." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Pengurus"
                subtitle={`Menampilkan ${displayData.length} data asatidz / pengurus.`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Pengurus</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Jabatan" : "Registrasi Pengurus"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required icon="fas fa-user-tag" />
                <div className="form-grid">
                    <SelectInput label="Jabatan" value={formData.jabatan} onChange={e => {
                        const val = e.target.value;
                        const isDH = listJabatan.some(j => j.nama_jabatan === val);
                        const isPleno = listDivisi.some(d => d.nama_jabatan === val);
                        let div = isDH ? 'DEWAN HARIAN' : (isPleno ? 'PLENO' : '');
                        setFormData({ ...formData, jabatan: val, divisi: div });
                    }} options={[
                        { label: '-- Dewan Harian --', value: '', disabled: true },
                        ...listJabatan.map(j => ({ label: j.nama_jabatan, value: j.nama_jabatan })),
                        { label: '-- Unit Kerja (Pleno) --', value: '', disabled: true },
                        ...listDivisi.map(d => ({ label: d.nama_jabatan, value: d.nama_jabatan }))
                    ]} />
                    <TextInput label="Divisi (Otomatis)" value={formData.divisi} readOnly style={{ background: '#f8fafc', fontWeight: 800 }} />
                </div>
                <div className="form-grid">
                    <TextInput label="Tahun Mulai" value={formData.tahun_mulai} onChange={e => setFormData({ ...formData, tahun_mulai: e.target.value })} />
                    <TextInput label="Tahun Akhir" value={formData.tahun_akhir} onChange={e => setFormData({ ...formData, tahun_akhir: e.target.value })} placeholder="Kosongkan jika aktif" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nomor WhatsApp" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} placeholder="Contoh: 0812345..." />
                    <TextInput label="Status Saat Ini" value={formData.status} readOnly style={{ background: '#f8fafc' }} />
                </div>
                <FileUploader label="Foto Pengurus" currentUrl={formData.foto_pengurus} onUploadSuccess={url => setFormData({ ...formData, foto_pengurus: url })} folder="simppds_pengurus" previewShape="square" />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Amanah Pengurus" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <img src={viewData.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama)}&size=200&background=1e3a8a&color=fff&bold=true`} style={{ width: '120px', height: '120px', borderRadius: '20px', marginBottom: '1.5rem', border: '4px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} alt="" />
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewData.nama}</h2>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>{viewData.jabatan}</div>
                            <span className="th-badge" style={{ marginTop: '5px' }}>{viewData.divisi}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                            <div className="form-grid" style={{ textAlign: 'center' }}>
                                <div><small>Masa Bakti</small><div style={{ fontWeight: 800 }}>{viewData.tahun_mulai} - {viewData.tahun_akhir || 'Sekarang'}</div></div>
                                <div><small>Status</small><div style={{ fontWeight: 800 }}>{viewData.status}</div></div>
                            </div>
                        </div>
                        {viewData.no_hp && (
                            <a href={`https://wa.me/${viewData.no_hp.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '1.5rem', padding: '1rem', background: '#25D366', color: '#fff', borderRadius: '15px', textDecoration: 'none', fontWeight: 800 }}>
                                <i className="fab fa-whatsapp fa-lg"></i> Hubungi via WhatsApp
                            </a>
                        )}
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isMutasiModalOpen}
                onClose={() => setIsMutasiModalOpen(false)}
                title={`Mutasi Pengurus: ${mutasiData.nama}`}
                footer={<button className="btn btn-primary" onClick={handleMutasi} disabled={loading}>{loading ? 'Memproses...' : 'Simpan Mutasi'}</button>}
            >
                <div style={{ padding: '10px' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>Pindahkan pengurus ini ke status non-aktif.</p>
                    <SelectInput
                        label="Pilih Status Baru"
                        value={mutasiData.status}
                        onChange={e => setMutasiData({ ...mutasiData, status: e.target.value })}
                        options={['Non-Aktif']}
                    />
                    <TextInput
                        label="Tanggal Mutasi"
                        type="date"
                        value={mutasiData.tanggal}
                        onChange={e => setMutasiData({ ...mutasiData, tanggal: e.target.value })}
                    />
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                        <small style={{ color: '#92400e', fontWeight: 700 }}>Info:</small>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>Masa bakti (Tahun Akhir) akan otomatis disesuaikan dengan tahun mutasi ini.</p>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Pengurus?"
                message="Data kepengurusan ini akan dihapus permanen dari riwayat organisasi."
            />
        </div>
    );
}